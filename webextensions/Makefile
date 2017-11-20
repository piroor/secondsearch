NPM_MOD_DIR := $(CURDIR)/node_modules
NPM_BIN_DIR := $(NPM_MOD_DIR)/.bin

.PHONY: xpi install_dependency lint format

all: xpi

install_dependency:
	npm install

lint:
	$(NPM_BIN_DIR)/eslint . --ext=.js –report-unused-disable-directives

format:
	$(NPM_BIN_DIR)/eslint . --ext=.js –report-unused-disable-directives --fix

xpi: lint ../extlib/webextensions-lib-l10n/l10n.js
	cd .. && git submodule update
	mkdir -p common
	cp ../extlib/webextensions-lib-l10n/l10n.js common/
	rm -f ./*.xpi
	zip -r -0 secondsearch-we.xpi manifest.json _locales common >/dev/null 2>/dev/null

../extlib/webextensions-lib-l10n/l10n.js:
	cd .. && git submodule update --init

