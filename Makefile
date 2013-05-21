#SRC = $(shell find src -name "*.js" -type f)
TEST_TIMEOUT = 2000
TEST_REPORTER = spec

src/parser.js:
	./node_modules/.bin/pegjs src/parser.pegjs

dist/r7rs.js:
	./node_modules/.bin/browserify \
		--standalone r7rs \
		--entry index.js \
		> dist/r7rs.js

all: src/parser.js dist/r7rs.js

test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha \
			--require should \
			--timeout $(TEST_TIMEOUT) \
			--reporter $(TEST_REPORTER) \
			--recursive \
			--bail


.PHONY: all test
