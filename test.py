import zstandard as zstd
import io
import json

RC_FILE = "sources/RC_2019-04.zst"

count = 0

with open(RC_FILE, "rb") as fh:
    dctx = zstd.ZstdDecompressor()

    with dctx.stream_reader(fh) as reader:
        text_stream = io.TextIOWrapper(reader, encoding="utf-8")

        for line in text_stream:
            obj = json.loads(line)

            print(obj)  # or print selected fields

            count += 1
            if count >= 10:
                break