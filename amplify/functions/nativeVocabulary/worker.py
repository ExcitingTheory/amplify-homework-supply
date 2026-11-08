"""JSON-lines worker. One document per process; NLP models are loaded once."""
import json
import math
import os
import sys
import unicodedata

LANGUAGES = {"es", "fr", "de", "pt", "it", "zh", "ja", "ar"}
VERSION = "stanza-wordfreq-v1"
MAX_LINE_BYTES = 16 * 1024 * 1024
MAX_LEMMAS = 200_000


def normalize(text):
    return unicodedata.normalize("NFKC", text).casefold().strip()


class Selector:
    def __init__(self, language, pipeline, frequency):
        self.language = language
        self.pipeline = pipeline
        self.frequency = frequency
        self.words = {}
        self.chunks = 0

    def add(self, page, text):
        if type(page) is not int or page < 1 or not isinstance(text, str) or len(text) > 12_000:
            raise ValueError("Invalid vocabulary chunk")
        document = self.pipeline(text)
        for sentence in document.sentences:
            tokens = sentence.tokens
            if not tokens:
                continue
            source = text[tokens[0].start_char:tokens[-1].end_char]
            for word in sentence.words:
                if word.upos not in {"NOUN", "ADJ", "VERB"} or not word.lemma:
                    continue
                lemma = normalize(word.lemma)
                if not any(char.isalpha() for char in lemma):
                    continue
                if lemma in self.words:
                    self.words[lemma]["count"] += 1
                else:
                    if len(self.words) >= MAX_LEMMAS:
                        raise ValueError("Document exceeds vocabulary lemma limit")
                    self.words[lemma] = {
                        "term": word.text, "page": page, "sourceText": source, "count": 1,
                    }
        self.chunks += 1

    def candidate(self, term, lemma, entry, reason, definition=None):
        # wordfreq is surface-form based. Lemmas group counts; observed forms
        # contribute reference frequencies so inflections are not treated as OOV.
        frequency = max(self.frequency(term, self.language), self.frequency(lemma, self.language))
        result = {
            "term": term, "lemma": lemma, "page": entry["page"],
            "sourceText": entry["sourceText"], "documentCount": entry["count"],
            "frequencyPerMillion": frequency * 1_000_000,
            "score": (1 + math.log(entry["count"])) * -math.log(max(frequency, 1e-9)),
            "reasons": [reason, "wordfreq-reference",
                        "absent-from-reference-corpus" if frequency == 0 else
                        "low-general-frequency" if frequency <= 20e-6 else "known-reference-frequency"],
        }
        if definition is not None:
            result["sourceDefinition"] = definition
        return result

    def finish(self, glossary):
        if not isinstance(glossary, list):
            raise ValueError("Invalid glossary")
        explicit = []
        explicit_lemmas = set()
        for entry in glossary:
            if (not isinstance(entry, dict) or
                any(not isinstance(entry.get(key), str) or not entry[key].strip()
                    for key in ("term", "sourceText", "definition")) or
                    type(entry.get("page")) is not int or entry["page"] < 1):
                raise ValueError("Invalid source definition")
            document = self.pipeline(entry["term"])
            lemma = " ".join(normalize(word.lemma or word.text)
                             for sentence in document.sentences for word in sentence.words)
            if not lemma:
                raise ValueError("Source definition has no lemma")
            explicit_lemmas.add(lemma)
            stats = self.words.get(lemma, {"count": 1})
            explicit.append(self.candidate(entry["term"], lemma, {
                **entry, "count": stats["count"],
            }, "explicit-source-definition", entry["definition"]))
        ranked = []
        for lemma, entry in self.words.items():
            if lemma in explicit_lemmas or entry["count"] < 2:
                continue
            item = self.candidate(entry["term"], lemma, entry, "repeated-in-document")
            if item["frequencyPerMillion"] <= 20:
                ranked.append(item)
        ranked.sort(key=lambda item: (-item["score"], item["lemma"]))
        return explicit + ranked[:40]


def emit(value):
    sys.stdout.write(json.dumps(value, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def run(stream):
    selector = None
    finished = False
    while True:
        line = stream.readline(MAX_LINE_BYTES + 1)
        if not line:
            break
        if len(line) > MAX_LINE_BYTES:
            raise ValueError("Vocabulary message exceeds byte limit")
        message = json.loads(line)
        if not isinstance(message, dict) or finished:
            raise ValueError("Invalid vocabulary protocol state")
        kind = message.get("type")
        if kind == "start" and selector is None:
            language = message.get("language")
            if language not in LANGUAGES:
                raise ValueError("Unsupported vocabulary language")
            import stanza
            from wordfreq import word_frequency
            import torch
            torch.set_num_threads(1)
            pipeline = stanza.Pipeline(
                lang="zh-hans" if language == "zh" else language,
                processors="tokenize,pos,lemma", package="default_fast",
                dir=os.environ["STANZA_RESOURCES_DIR"],
                use_gpu=False, download_method=stanza.DownloadMethod.NONE,
                logging_level="ERROR",
            )
            selector = Selector(language, pipeline, word_frequency)
            emit({"type": "ready", "version": VERSION})
        elif kind == "chunk" and selector is not None:
            selector.add(message.get("page"), message.get("text"))
            emit({"type": "chunk", "index": selector.chunks})
        elif kind == "finish" and selector is not None:
            emit({"type": "result", "version": VERSION, "chunks": selector.chunks,
                  "candidates": selector.finish(message.get("glossary"))})
            finished = True
        else:
            raise ValueError("Invalid vocabulary protocol order")
    if not finished:
        raise ValueError("Incomplete vocabulary document")


if __name__ == "__main__":
    try:
        run(sys.stdin.buffer)
    except Exception as error:
        # Do not echo document text, stdout, or exception messages from NLP libraries.
        print(f"Native vocabulary worker failed: {type(error).__name__}", file=sys.stderr)
        sys.exit(1)
