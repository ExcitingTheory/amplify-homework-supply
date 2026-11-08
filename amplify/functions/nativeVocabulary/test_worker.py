import io
import re
import unittest
from types import SimpleNamespace
from worker import Selector, run


def pipeline(text):
    tokens = [SimpleNamespace(start_char=match.start(), end_char=match.end())
              for match in re.finditer(r"\w+", text)]
    words = [SimpleNamespace(text=match.group(), lemma=match.group().lower(), upos="NOUN")
             for match in re.finditer(r"\w+", text)]
    return SimpleNamespace(sentences=[SimpleNamespace(tokens=tokens, words=words)])


class SelectorTests(unittest.TestCase):
    def selector(self):
        return Selector("es", pipeline, lambda term, language: 0.000001)

    def test_counts_across_chunks_without_resetting_rank_or_cap(self):
        combined = self.selector()
        combined.add(3, "membrana celular. membrana celular.")
        chunked = self.selector()
        chunked.add(3, "membrana celular.")
        chunked.add(4, "membrana celular.")
        first = combined.finish([])
        second = chunked.finish([])
        self.assertEqual([(x["lemma"], x["documentCount"], x["score"]) for x in first],
                         [(x["lemma"], x["documentCount"], x["score"]) for x in second])
        self.assertTrue(all(x["page"] == 3 for x in second))
        self.assertTrue(all(x["sourceText"] == "membrana celular" for x in second))

    def test_explicit_terms_bypass_rarity_and_repeat_thresholds(self):
        selector = Selector("es", pipeline, lambda term, language: 0.1)
        selector.add(2, "Agua - Líquido esencial.")
        result = selector.finish([{
            "term": "Agua", "definition": "Líquido esencial.",
            "sourceText": "Agua - Líquido esencial.", "page": 2,
        }])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["sourceDefinition"], "Líquido esencial.")
        self.assertEqual(result[0]["page"], 2)

    def test_global_ranked_cap_is_not_applied_once_per_chunk(self):
        selector = self.selector()
        text = " ".join("término" + chr(0x4E00 + index) for index in range(60))
        for page in range(1, 5):
            selector.add(page, text)
        self.assertEqual(len(selector.finish([])), 40)
        self.assertTrue(all(x["documentCount"] == 4 for x in selector.finish([])))

    def test_rejects_bad_chunks_and_protocol_order(self):
        with self.assertRaises(ValueError):
            self.selector().add(0, "texto")
        with self.assertRaises(ValueError):
            self.selector().add(1, "x" * 12_001)
        with self.assertRaises(ValueError):
            run(io.BytesIO(b'{"type":"chunk","page":1,"text":"text"}\n'))
        with self.assertRaises(ValueError):
            run(io.BytesIO(b""))


if __name__ == "__main__":
    unittest.main()
