import argparse
import os
import stanza

LANGUAGES = ("es", "fr", "de", "pt", "it", "zh-hans", "ja", "ar")
STANZA_VERSION = "1.15.0"
RESOURCES_VERSION = "1.15.0"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("language", nargs="?", choices=LANGUAGES)
    args = parser.parse_args()
    if stanza.__version__ != STANZA_VERSION:
        raise RuntimeError("Model preparation requires stanza==" + STANZA_VERSION)
    for language in (args.language,) if args.language else LANGUAGES:
        stanza.download(
            language, model_dir=os.environ["STANZA_RESOURCES_DIR"],
            processors="tokenize,pos,lemma", package="default_fast", verbose=False,
            resources_version=RESOURCES_VERSION,
        )


if __name__ == "__main__":
    main()
