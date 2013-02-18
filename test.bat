@echo off
SET REPORTER=dot
mocha --ui exports --globals name --reporter %REPORTER% -g ".*%1.*"
