CC=tsc
PL=perl
TS=\
	src/ntspm.ts \
	src/version.ts \
	test/version.test.ts \

JS=$(subst .ts,.js,$(TS))

build: $(JS)

%.js: %.ts
	$(CC) $<
	@#mv $@ $@.tmp
	@#$(PL) -p -e 's/\n/\r\n/' < $@.tmp > $@
	@#rm $@.tmp

clean:
	rm $(JS)

.PHONY: build
