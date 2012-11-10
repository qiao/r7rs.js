SRC = $(shell find src -name "*.js" -type f)
TEST_TIMEOUT = 2000
TEST_REPORTER = spec

all:
	pegjs src/parser.pegjs

test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha \
			--require should \
			--timeout $(TEST_TIMEOUT) \
			--reporter $(TEST_REPORTER) \
			--bail


.PHONY: test
