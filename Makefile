ifdef GREP
	GREPARG = -g $(GREP)
endif

REPORTER ?= spec
TESTS = ./test
NPM_BIN = ./node_modules/.bin

jshint:
	$(NPM_BIN)/jshint lib test tools

test: jshint
	$(NPM_BIN)/mocha --globals setImmediate,clearImmediate --recursive --check-leaks --colors -t 10000 --reporter $(REPORTER) $(TESTS) $(GREPARG)

.PHONY: jshint test
