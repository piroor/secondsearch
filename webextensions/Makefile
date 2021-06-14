NPM_MOD_DIR := $(CURDIR)/node_modules
NPM_BIN_DIR := $(NPM_MOD_DIR)/.bin

.PHONY: xpi install_dependency lint format init_extlib update_extlib install_extlib

all: xpi

install_dependency:
	[ -e "$(NPM_BIN_DIR)/eslint" -a -e "$(NPM_BIN_DIR)/jsonlint-cli" ] || npm install

lint: install_dependency
	"$(NPM_BIN_DIR)/eslint" . --ext=.js --report-unused-disable-directives
	find . -type d -name node_modules -prune -o -type f -name '*.json' -print | xargs "$(NPM_BIN_DIR)/jsonlint-cli"

format: install_dependency
	"$(NPM_BIN_DIR)/eslint" . --ext=.js --report-unused-disable-directives --fix

xpi: init_extlib install_extlib lint
	rm -f ./*.xpi
	zip -r -9 secondsearch-we.xpi manifest.json common _locales background panel options resources extlib >/dev/null -x '*/.*' 2>/dev/null

init_extlib:
	git submodule update --init

update_extlib:
	git submodule foreach 'git checkout trunk || git checkout main || git checkout master && git pull'

install_extlib:
	rm -rf extlib/*.js
	cp ../submodules/webextensions-lib-configs/Configs.js extlib/
	cp ../submodules/webextensions-lib-l10n/l10n.js extlib/
	cp ../submodules/webextensions-lib-options/Options.js extlib/
	cp ../submodules/webextensions-lib-scroll/scroll.js extlib/

