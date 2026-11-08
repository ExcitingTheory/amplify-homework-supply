import contextlib
import io
import runpy
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch


class DownloadModelsTests(unittest.TestCase):
    def run_download(self, *languages):
        download = Mock()
        script = Path(__file__).with_name("download_models.py")
        with patch.dict("sys.modules", {"stanza": SimpleNamespace(download=download, __version__="1.15.0")}), \
                patch.dict("os.environ", {"STANZA_RESOURCES_DIR": "/models"}), \
                patch("sys.argv", [str(script), *languages]):
            runpy.run_path(str(script), run_name="__main__")
        return download

    def test_downloads_only_requested_language(self):
        download = self.run_download("zh-hans")
        download.assert_called_once_with(
            "zh-hans", model_dir="/models", processors="tokenize,pos,lemma",
            package="default_fast", verbose=False,
            resources_version="1.15.0",
        )

    def test_preserves_default_eight_languages(self):
        download = self.run_download()
        self.assertEqual(
            [call.args[0] for call in download.call_args_list],
            ["es", "fr", "de", "pt", "it", "zh-hans", "ja", "ar"],
        )

    def test_rejects_unsupported_language(self):
        with contextlib.redirect_stderr(io.StringIO()), \
                self.assertRaises(SystemExit) as error:
            self.run_download("xx")
        self.assertEqual(error.exception.code, 2)

    def test_rejects_wrong_stanza_version_before_downloading(self):
        download = Mock()
        script = Path(__file__).with_name("download_models.py")
        with patch.dict("sys.modules", {"stanza": SimpleNamespace(download=download, __version__="1.14.0")}), \
                patch("sys.argv", [str(script), "es"]), \
                self.assertRaisesRegex(RuntimeError, "requires stanza==1.15.0"):
            runpy.run_path(str(script), run_name="__main__")
        download.assert_not_called()


if __name__ == "__main__":
    unittest.main()
