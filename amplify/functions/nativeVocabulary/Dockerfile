FROM node:22-bookworm-slim AS build
WORKDIR /build
COPY amplify/functions/nativeVocabulary/package.json amplify/functions/nativeVocabulary/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY amplify/functions/documentAnalysis/vocabularyGlossary.ts amplify/functions/documentAnalysis/
COPY amplify/functions/nativeVocabulary/handler.ts amplify/functions/nativeVocabulary/pythonBridge.ts amplify/functions/nativeVocabulary/protocol.ts amplify/functions/nativeVocabulary/
COPY amplify/functions/nativeVocabulary/modelAssets.ts amplify/functions/nativeVocabulary/modelReleases.json amplify/functions/nativeVocabulary/
RUN node_modules/.bin/esbuild amplify/functions/nativeVocabulary/handler.ts \
    --bundle --platform=node --target=node22 --format=cjs --outfile=/build/handler.cjs

# Use Debian as base instead of ECR Lambda image
# This is compatible with Lambda's execution environment
FROM debian:bookworm-slim

# Install Node.js runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js from NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Python and dependencies (use python3.11 from Bookworm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3-pip \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ENV OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 PYTHONDONTWRITEBYTECODE=1
ENV LAMBDA_TASK_ROOT="/var/task"

# Create task root
RUN mkdir -p ${LAMBDA_TASK_ROOT}
WORKDIR ${LAMBDA_TASK_ROOT}

# Install Python dependencies (use python3.11)
# Install PyTorch and dependencies from PyPI + CPU wheels
RUN env -u LD_LIBRARY_PATH python3.11 -m pip install --break-system-packages --no-cache-dir \
    torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple/

COPY amplify/functions/nativeVocabulary/requirements.txt /opt/requirements.txt
RUN env -u LD_LIBRARY_PATH python3.11 -m pip install --break-system-packages --no-cache-dir -r /opt/requirements.txt
RUN env -u LD_LIBRARY_PATH python3.11 -m pip install --break-system-packages --no-cache-dir 'wordfreq[cjk]==3.1.1'

# Copy compiled handler from build stage
COPY --from=build /build/handler.cjs ${LAMBDA_TASK_ROOT}/handler.js
COPY amplify/functions/nativeVocabulary/worker.py ${LAMBDA_TASK_ROOT}/worker.py

CMD ["node", "handler.js"]
