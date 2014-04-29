TEST_TIMEOUT = 2000
TEST_REPORTER = spec

all: parser dist

parser:
	./node_modules/.bin/pegjs src/parser.pegjs

dist:
	./node_modules/.bin/browserify \
		--standalone r7rs \
		--entry src/index.js \
		> dist/r7rs.js

test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha \
			--require should \
			--timeout $(TEST_TIMEOUT) \
			--reporter $(TEST_REPORTER) \
			--recursive \
			--check-leaks \
			--bail \
			test/unit \
			test/system

test-cov: src-cov
	@R7RS_COV=1 $(MAKE) test TEST_REPORTER=html-cov > coverage.html

src-cov: clean
	@jscoverage src src-cov

benchmark:
	@node benchmark/benchmark.js

clean:
	@rm -f coverage.html
	@rm -rf src-cov

.PHONY: parser dist all test test-cov src-cov benchmark clean
