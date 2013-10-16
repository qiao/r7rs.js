TEST_TIMEOUT = 2000
TEST_REPORTER = spec

parser:
	./node_modules/.bin/pegjs src/parser.pegjs

dist:
	./node_modules/.bin/browserify \
		--standalone r7rs \
		--entry index.js \
		> dist/r7rs.js

all: parser dist

test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha \
			--require should \
			--timeout $(TEST_TIMEOUT) \
			--reporter $(TEST_REPORTER) \
			--recursive \
			--bail

benchmark:
	@node benchmark/benchmark.js



.PHONY: parser dist all test benchmark
