var HTML_ENTITY_TABLE = {
	//HTML special chars table
	quot : 0x0022,  //"\x22" ["] &#34; quotation mark = APL quote
	amp  : 0x0026,  //"\x26" [&] &#38; ampersand
	lt   : 0x003C,  //"\x3c" [<] &#60; less-than sign
	gt   : 0x003E,  //"\x3e" [>] &#62; greater-than sign
	//&apos; entity is only available in XHTML and not in plain HTML, see http://www.w3.org/TR/xhtml1///C_16
	apos : 0x0027,  //"\x27" ['] &#39; apostrophe
	//Latin-1 Entities:
	nbsp   : 0x00A0,  //"\xc2\xa0" [ ] no-break space = non-breaking space
	iexcl  : 0x00A1,  //"\xc2\xa1" [¡] inverted exclamation mark
	cent   : 0x00A2,  //"\xc2\xa2" [¢] cent sign
	pound  : 0x00A3,  //"\xc2\xa3" [£] pound sign
	curren : 0x00A4,  //"\xc2\xa4" [¤] currency sign
	yen    : 0x00A5,  //"\xc2\xa5" [¥] yen sign = yuan sign
	brvbar : 0x00A6,  //"\xc2\xa6" [¦] broken bar = broken vertical bar
	sect   : 0x00A7,  //"\xc2\xa7" [§] section sign
	uml    : 0x00A8,  //"\xc2\xa8" [¨] diaeresis = spacing diaeresis
	copy   : 0x00A9,  //"\xc2\xa9" [©] copyright sign
	ordf   : 0x00AA,  //"\xc2\xaa" [ª] feminine ordinal indicator
	laquo  : 0x00AB,  //"\xc2\xab" [«] left-pointing double angle quotation mark = left pointing guillemet
	not    : 0x00AC,  //"\xc2\xac" [¬] not sign
	shy    : 0x00AD,  //"\xc2\xad" [ ] soft hyphen = discretionary hyphen
	reg    : 0x00AE,  //"\xc2\xae" [®] registered sign = registered trade mark sign
	macr   : 0x00AF,  //"\xc2\xaf" [¯] macron = spacing macron = overline = APL overbar
	deg    : 0x00B0,  //"\xc2\xb0" [°] degree sign
	plusmn : 0x00B1,  //"\xc2\xb1" [±] plus-minus sign = plus-or-minus sign
	sup2   : 0x00B2,  //"\xc2\xb2" [²] superscript two = superscript digit two = squared
	sup3   : 0x00B3,  //"\xc2\xb3" [³] superscript three = superscript digit three = cubed
	acute  : 0x00B4,  //"\xc2\xb4" [´] acute accent = spacing acute
	micro  : 0x00B5,  //"\xc2\xb5" [µ] micro sign
	para   : 0x00B6,  //"\xc2\xb6" [¶] pilcrow sign = paragraph sign
	middot : 0x00B7,  //"\xc2\xb7" [·] middle dot = Georgian comma = Greek middle dot
	cedil  : 0x00B8,  //"\xc2\xb8" [¸] cedilla = spacing cedilla
	sup1   : 0x00B9,  //"\xc2\xb9" [¹] superscript one = superscript digit one
	ordm   : 0x00BA,  //"\xc2\xba" [º] masculine ordinal indicator
	raquo  : 0x00BB,  //"\xc2\xbb" [»] right-pointing double angle quotation mark = right pointing guillemet
	frac14 : 0x00BC,  //"\xc2\xbc" [¼] vulgar fraction one quarter = fraction one quarter
	frac12 : 0x00BD,  //"\xc2\xbd" [½] vulgar fraction one half = fraction one half
	frac34 : 0x00BE,  //"\xc2\xbe" [¾] vulgar fraction three quarters = fraction three quarters
	iquest : 0x00BF,  //"\xc2\xbf" [¿] inverted question mark = turned question mark
	//Latin capital letter
	Agrave : 0x00C0,  //"\xc3\x80" Latin capital letter A with grave = Latin capital letter A grave
	Aacute : 0x00C1,  //"\xc3\x81" Latin capital letter A with acute
	Acirc  : 0x00C2,  //"\xc3\x82" Latin capital letter A with circumflex
	Atilde : 0x00C3,  //"\xc3\x83" Latin capital letter A with tilde
	Auml   : 0x00C4,  //"\xc3\x84" Latin capital letter A with diaeresis
	Aring  : 0x00C5,  //"\xc3\x85" Latin capital letter A with ring above = Latin capital letter A ring
	AElig  : 0x00C6,  //"\xc3\x86" Latin capital letter AE = Latin capital ligature AE
	Ccedil : 0x00C7,  //"\xc3\x87" Latin capital letter C with cedilla
	Egrave : 0x00C8,  //"\xc3\x88" Latin capital letter E with grave
	Eacute : 0x00C9,  //"\xc3\x89" Latin capital letter E with acute
	Ecirc  : 0x00CA,  //"\xc3\x8a" Latin capital letter E with circumflex
	Euml   : 0x00CB,  //"\xc3\x8b" Latin capital letter E with diaeresis
	Igrave : 0x00CC,  //"\xc3\x8c" Latin capital letter I with grave
	Iacute : 0x00CD,  //"\xc3\x8d" Latin capital letter I with acute
	Icirc  : 0x00CE,  //"\xc3\x8e" Latin capital letter I with circumflex
	Iuml   : 0x00CF,  //"\xc3\x8f" Latin capital letter I with diaeresis
	ETH    : 0x00D0,  //"\xc3\x90" Latin capital letter ETH
	Ntilde : 0x00D1,  //"\xc3\x91" Latin capital letter N with tilde
	Ograve : 0x00D2,  //"\xc3\x92" Latin capital letter O with grave
	Oacute : 0x00D3,  //"\xc3\x93" Latin capital letter O with acute
	Ocirc  : 0x00D4,  //"\xc3\x94" Latin capital letter O with circumflex
	Otilde : 0x00D5,  //"\xc3\x95" Latin capital letter O with tilde
	Ouml   : 0x00D6,  //"\xc3\x96" Latin capital letter O with diaeresis
	times  : 0x00D7,  //"\xc3\x97" [×] multiplication sign
	Oslash : 0x00D8,  //"\xc3\x98" Latin capital letter O with stroke = Latin capital letter O slash
	Ugrave : 0x00D9,  //"\xc3\x99" Latin capital letter U with grave
	Uacute : 0x00DA,  //"\xc3\x9a" Latin capital letter U with acute
	Ucirc  : 0x00DB,  //"\xc3\x9b" Latin capital letter U with circumflex
	Uuml   : 0x00DC,  //"\xc3\x9c" Latin capital letter U with diaeresis
	Yacute : 0x00DD,  //"\xc3\x9d" Latin capital letter Y with acute
	THORN  : 0x00DE,  //"\xc3\x9e" Latin capital letter THORN
	//Latin small letter
	szlig  : 0x00DF,  //"\xc3\x9f" Latin small letter sharp s = ess-zed
	agrave : 0x00E0,  //"\xc3\xa0" Latin small letter a with grave = Latin small letter a grave
	aacute : 0x00E1,  //"\xc3\xa1" Latin small letter a with acute
	acirc  : 0x00E2,  //"\xc3\xa2" Latin small letter a with circumflex
	atilde : 0x00E3,  //"\xc3\xa3" Latin small letter a with tilde
	auml   : 0x00E4,  //"\xc3\xa4" Latin small letter a with diaeresis
	aring  : 0x00E5,  //"\xc3\xa5" Latin small letter a with ring above = Latin small letter a ring
	aelig  : 0x00E6,  //"\xc3\xa6" Latin small letter ae = Latin small ligature ae
	ccedil : 0x00E7,  //"\xc3\xa7" Latin small letter c with cedilla
	egrave : 0x00E8,  //"\xc3\xa8" Latin small letter e with grave
	eacute : 0x00E9,  //"\xc3\xa9" Latin small letter e with acute
	ecirc  : 0x00EA,  //"\xc3\xaa" Latin small letter e with circumflex
	euml   : 0x00EB,  //"\xc3\xab" Latin small letter e with diaeresis
	igrave : 0x00EC,  //"\xc3\xac" Latin small letter i with grave
	iacute : 0x00ED,  //"\xc3\xad" Latin small letter i with acute
	icirc  : 0x00EE,  //"\xc3\xae" Latin small letter i with circumflex
	iuml   : 0x00EF,  //"\xc3\xaf" Latin small letter i with diaeresis
	eth    : 0x00F0,  //"\xc3\xb0" Latin small letter eth
	ntilde : 0x00F1,  //"\xc3\xb1" Latin small letter n with tilde
	ograve : 0x00F2,  //"\xc3\xb2" Latin small letter o with grave
	oacute : 0x00F3,  //"\xc3\xb3" Latin small letter o with acute
	ocirc  : 0x00F4,  //"\xc3\xb4" Latin small letter o with circumflex
	otilde : 0x00F5,  //"\xc3\xb5" Latin small letter o with tilde
	ouml   : 0x00F6,  //"\xc3\xb6" Latin small letter o with diaeresis
	divide : 0x00F7,  //"\xc3\xb7" [÷] division sign
	oslash : 0x00F8,  //"\xc3\xb8" Latin small letter o with stroke = Latin small letter o slash
	ugrave : 0x00F9,  //"\xc3\xb9" Latin small letter u with grave
	uacute : 0x00FA,  //"\xc3\xba" Latin small letter u with acute
	ucirc  : 0x00FB,  //"\xc3\xbb" Latin small letter u with circumflex
	uuml   : 0x00FC,  //"\xc3\xbc" Latin small letter u with diaeresis
	yacute : 0x00FD,  //"\xc3\xbd" Latin small letter y with acute
	thorn  : 0x00FE,  //"\xc3\xbe" Latin small letter thorn
	yuml   : 0x00FF,  //"\xc3\xbf" Latin small letter y with diaeresis
	OElig  : 0x0152,  //"\xc5\x92" [Œ] Latin capital ligature OE
	oelig  : 0x0153,  //"\xc5\x93" [œ] Latin small ligature oe
	Scaron : 0x0160,  //"\xc5\xa0" [Š] Latin capital letter S with caron
	scaron : 0x0161,  //"\xc5\xa1" [š] Latin small letter s with caron
	Yuml   : 0x0178,  //"\xc5\xb8" [Ÿ] Latin capital letter Y with diaeresis
	fnof   : 0x0192,  //"\xc6\x92" [ƒ] Latin small f with hook = function = florin
	circ   : 0x02C6,  //"\xcb\x86" [ˆ] modifier letter circumflex accent
	tilde  : 0x02DC,  //"\xcb\x9c" [˜] small tilde
	//Symbols and Greek Letters:
	Alpha   : 0x0391,  //"\xce\x91" Greek capital letter alpha
	Beta    : 0x0392,  //"\xce\x92" Greek capital letter beta
	Gamma   : 0x0393,  //"\xce\x93" Greek capital letter gamma
	Delta   : 0x0394,  //"\xce\x94" Greek capital letter delta
	Epsilon : 0x0395,  //"\xce\x95" Greek capital letter epsilon
	Zeta    : 0x0396,  //"\xce\x96" Greek capital letter zeta
	Eta     : 0x0397,  //"\xce\x97" Greek capital letter eta
	Theta   : 0x0398,  //"\xce\x98" Greek capital letter theta
	Iota    : 0x0399,  //"\xce\x99" Greek capital letter iota
	Kappa   : 0x039A,  //"\xce\x9a" Greek capital letter kappa
	Lambda  : 0x039B,  //"\xce\x9b" Greek capital letter lambda
	Mu      : 0x039C,  //"\xce\x9c" Greek capital letter mu
	Nu      : 0x039D,  //"\xce\x9d" Greek capital letter nu
	Xi      : 0x039E,  //"\xce\x9e" Greek capital letter xi
	Omicron : 0x039F,  //"\xce\x9f" Greek capital letter omicron
	Pi      : 0x03A0,  //"\xce\xa0" Greek capital letter pi
	Rho     : 0x03A1,  //"\xce\xa1" Greek capital letter rho
	Sigma   : 0x03A3,  //"\xce\xa3" Greek capital letter sigma
	Tau     : 0x03A4,  //"\xce\xa4" Greek capital letter tau
	Upsilon : 0x03A5,  //"\xce\xa5" Greek capital letter upsilon
	Phi     : 0x03A6,  //"\xce\xa6" Greek capital letter phi
	Chi     : 0x03A7,  //"\xce\xa7" Greek capital letter chi
	Psi     : 0x03A8,  //"\xce\xa8" Greek capital letter psi
	Omega   : 0x03A9,  //"\xce\xa9" Greek capital letter omega
	alpha   : 0x03B1,  //"\xce\xb1" Greek small letter alpha
	beta    : 0x03B2,  //"\xce\xb2" Greek small letter beta
	gamma   : 0x03B3,  //"\xce\xb3" Greek small letter gamma
	delta   : 0x03B4,  //"\xce\xb4" Greek small letter delta
	epsilon : 0x03B5,  //"\xce\xb5" Greek small letter epsilon
	zeta    : 0x03B6,  //"\xce\xb6" Greek small letter zeta
	eta     : 0x03B7,  //"\xce\xb7" Greek small letter eta
	theta   : 0x03B8,  //"\xce\xb8" Greek small letter theta
	iota    : 0x03B9,  //"\xce\xb9" Greek small letter iota
	kappa   : 0x03BA,  //"\xce\xba" Greek small letter kappa
	lambda  : 0x03BB,  //"\xce\xbb" Greek small letter lambda
	mu      : 0x03BC,  //"\xce\xbc" Greek small letter mu
	nu      : 0x03BD,  //"\xce\xbd" Greek small letter nu
	xi      : 0x03BE,  //"\xce\xbe" Greek small letter xi
	omicron : 0x03BF,  //"\xce\xbf" Greek small letter omicron
	pi      : 0x03C0,  //"\xcf\x80" Greek small letter pi
	rho     : 0x03C1,  //"\xcf\x81" Greek small letter rho
	sigmaf  : 0x03C2,  //"\xcf\x82" Greek small letter final sigma
	sigma   : 0x03C3,  //"\xcf\x83" Greek small letter sigma
	tau     : 0x03C4,  //"\xcf\x84" Greek small letter tau
	upsilon : 0x03C5,  //"\xcf\x85" Greek small letter upsilon
	phi     : 0x03C6,  //"\xcf\x86" Greek small letter phi
	chi     : 0x03C7,  //"\xcf\x87" Greek small letter chi
	psi     : 0x03C8,  //"\xcf\x88" Greek small letter psi
	omega   : 0x03C9,  //"\xcf\x89" Greek small letter omega
	thetasym: 0x03D1,  //"\xcf\x91" Greek small letter theta symbol
	upsih   : 0x03D2,  //"\xcf\x92" Greek upsilon with hook symbol
	piv     : 0x03D6,  //"\xcf\x96" [ϖ] Greek pi symbol
	//Other chars:
	ensp    : 0x2002,  //"\xe2\x80\x82" [ ] en space
	emsp    : 0x2003,  //"\xe2\x80\x83" [ ] em space
	thinsp  : 0x2009,  //"\xe2\x80\x89" [ ] thin space
	zwnj    : 0x200C,  //"\xe2\x80\x8c" [‌] zero width non-joiner
	zwj     : 0x200D,  //"\xe2\x80\x8d" [‍] zero width joiner
	lrm     : 0x200E,  //"\xe2\x80\x8e" [‎] left-to-right mark
	rlm     : 0x200F,  //"\xe2\x80\x8f" [‏] right-to-left mark
	ndash   : 0x2013,  //"\xe2\x80\x93" [–] en dash
	mdash   : 0x2014,  //"\xe2\x80\x94" [—] em dash
	lsquo   : 0x2018,  //"\xe2\x80\x98" [‘] left single quotation mark
	rsquo   : 0x2019,  //"\xe2\x80\x99" [’] right single quotation mark (and apostrophe!)
	sbquo   : 0x201A,  //"\xe2\x80\x9a" [‚] single low-9 quotation mark
	ldquo   : 0x201C,  //"\xe2\x80\x9c" [“] left double quotation mark
	rdquo   : 0x201D,  //"\xe2\x80\x9d" [”] right double quotation mark
	bdquo   : 0x201E,  //"\xe2\x80\x9e" [„] double low-9 quotation mark
	dagger  : 0x2020,  //"\xe2\x80\xa0" [†] dagger
	Dagger  : 0x2021,  //"\xe2\x80\xa1" [‡] double dagger
	bull    : 0x2022,  //"\xe2\x80\xa2" [•] bullet = black small circle
	hellip  : 0x2026,  //"\xe2\x80\xa6" […] horizontal ellipsis = three dot leader
	permil  : 0x2030,  //"\xe2\x80\xb0" [‰] per mille sign
	prime   : 0x2032,  //"\xe2\x80\xb2" [′] prime = minutes = feet (для обозначения минут и футов)
	Prime   : 0x2033,  //"\xe2\x80\xb3" [″] double prime = seconds = inches (для обозначения секунд и дюймов).
	lsaquo  : 0x2039,  //"\xe2\x80\xb9" [‹] single left-pointing angle quotation mark
	rsaquo  : 0x203A,  //"\xe2\x80\xba" [›] single right-pointing angle quotation mark
	oline   : 0x203E,  //"\xe2\x80\xbe" [‾] overline = spacing overscore
	frasl   : 0x2044,  //"\xe2\x81\x84" [⁄] fraction slash
	euro    : 0x20AC,  //"\xe2\x82\xac" [€] euro sign
	image   : 0x2111,  //"\xe2\x84\x91" [ℑ] blackletter capital I = imaginary part
	weierp  : 0x2118,  //"\xe2\x84\x98" [℘] script capital P = power set = Weierstrass p
	real    : 0x211C,  //"\xe2\x84\x9c" [ℜ] blackletter capital R = real part symbol
	trade   : 0x2122,  //"\xe2\x84\xa2" [™] trade mark sign
	alefsym : 0x2135,  //"\xe2\x84\xb5" [ℵ] alef symbol = first transfinite cardinal
	larr    : 0x2190,  //"\xe2\x86\x90" [←] leftwards arrow
	uarr    : 0x2191,  //"\xe2\x86\x91" [↑] upwards arrow
	rarr    : 0x2192,  //"\xe2\x86\x92" [→] rightwards arrow
	darr    : 0x2193,  //"\xe2\x86\x93" [↓] downwards arrow
	harr    : 0x2194,  //"\xe2\x86\x94" [↔] left right arrow
	crarr   : 0x21B5,  //"\xe2\x86\xb5" [↵] downwards arrow with corner leftwards = carriage return
	lArr    : 0x21D0,  //"\xe2\x87\x90" [⇐] leftwards double arrow
	uArr    : 0x21D1,  //"\xe2\x87\x91" [⇑] upwards double arrow
	rArr    : 0x21D2,  //"\xe2\x87\x92" [⇒] rightwards double arrow
	dArr    : 0x21D3,  //"\xe2\x87\x93" [⇓] downwards double arrow
	hArr    : 0x21D4,  //"\xe2\x87\x94" [⇔] left right double arrow
	forall  : 0x2200,  //"\xe2\x88\x80" [∀] for all
	part    : 0x2202,  //"\xe2\x88\x82" [∂] partial differential
	exist   : 0x2203,  //"\xe2\x88\x83" [∃] there exists
	empty   : 0x2205,  //"\xe2\x88\x85" [∅] empty set = null set = diameter
	nabla   : 0x2207,  //"\xe2\x88\x87" [∇] nabla = backward difference
	isin    : 0x2208,  //"\xe2\x88\x88" [∈] element of
	notin   : 0x2209,  //"\xe2\x88\x89" [∉] not an element of
	ni      : 0x220B,  //"\xe2\x88\x8b" [∋] contains as member
	prod    : 0x220F,  //"\xe2\x88\x8f" [∏] n-ary product = product sign
	sum     : 0x2211,  //"\xe2\x88\x91" [∑] n-ary sumation
	minus   : 0x2212,  //"\xe2\x88\x92" [−] minus sign
	lowast  : 0x2217,  //"\xe2\x88\x97" [∗] asterisk operator
	radic   : 0x221A,  //"\xe2\x88\x9a" [√] square root = radical sign
	prop    : 0x221D,  //"\xe2\x88\x9d" [∝] proportional to
	infin   : 0x221E,  //"\xe2\x88\x9e" [∞] infinity
	ang     : 0x2220,  //"\xe2\x88\xa0" [∠] angle
	and     : 0x2227,  //"\xe2\x88\xa7" [∧] logical and = wedge
	or      : 0x2228,  //"\xe2\x88\xa8" [∨] logical or = vee
	cap     : 0x2229,  //"\xe2\x88\xa9" [∩] intersection = cap
	cup     : 0x222A,  //"\xe2\x88\xaa" [∪] union = cup
	"int"   : 0x222B,  //"\xe2\x88\xab" [∫] integral
	there4  : 0x2234,  //"\xe2\x88\xb4" [∴] therefore
	sim     : 0x223C,  //"\xe2\x88\xbc" [∼] tilde operator = varies with = similar to
	cong    : 0x2245,  //"\xe2\x89\x85" [≅] approximately equal to
	asymp   : 0x2248,  //"\xe2\x89\x88" [≈] almost equal to = asymptotic to
	ne      : 0x2260,  //"\xe2\x89\xa0" [≠] not equal to
	equiv   : 0x2261,  //"\xe2\x89\xa1" [≡] identical to
	le      : 0x2264,  //"\xe2\x89\xa4" [≤] less-than or equal to
	ge      : 0x2265,  //"\xe2\x89\xa5" [≥] greater-than or equal to
	sub     : 0x2282,  //"\xe2\x8a\x82" [⊂] subset of
	sup     : 0x2283,  //"\xe2\x8a\x83" [⊃] superset of
	nsub    : 0x2284,  //"\xe2\x8a\x84" [⊄] not a subset of
	sube    : 0x2286,  //"\xe2\x8a\x86" [⊆] subset of or equal to
	supe    : 0x2287,  //"\xe2\x8a\x87" [⊇] superset of or equal to
	oplus   : 0x2295,  //"\xe2\x8a\x95" [⊕] circled plus = direct sum
	otimes  : 0x2297,  //"\xe2\x8a\x97" [⊗] circled times = vector product
	perp    : 0x22A5,  //"\xe2\x8a\xa5" [⊥] up tack = orthogonal to = perpendicular
	sdot    : 0x22C5,  //"\xe2\x8b\x85" [⋅] dot operator
	lceil   : 0x2308,  //"\xe2\x8c\x88" [⌈] left ceiling = APL upstile
	rceil   : 0x2309,  //"\xe2\x8c\x89" [⌉] right ceiling
	lfloor  : 0x230A,  //"\xe2\x8c\x8a" [⌊] left floor = APL downstile
	rfloor  : 0x230B,  //"\xe2\x8c\x8b" [⌋] right floor
	lang    : 0x2329,  //"\xe2\x8c\xa9" [〈] left-pointing angle bracket = bra
	rang    : 0x232A,  //"\xe2\x8c\xaa" [〉] right-pointing angle bracket = ket
	loz     : 0x25CA,  //"\xe2\x97\x8a" [◊] lozenge
	spades  : 0x2660,  //"\xe2\x99\xa0" [♠] black spade suit
	clubs   : 0x2663,  //"\xe2\x99\xa3" [♣] black club suit = shamrock
	hearts  : 0x2665,  //"\xe2\x99\xa5" [♥] black heart suit = valentine
	diams   : 0x2666  //"\xe2\x99\xa6" [♦] black diamond suit
};

var HTML_ENTITY_RE = /&([a-zA-Z][a-zA-Z\d]+|\#(?:\d{1,5}|x[\da-fA-F]{2,4}));/g,
	entityReplace = function (str, key) {
		if (key[0] !== '#') {
			if (HTML_ENTITY_TABLE.hasOwnProperty(key))
				return String.fromCharCode(HTML_ENTITY_TABLE[key]);
			return '&' + key + ';'; //unknown entry
		}
		return String.fromCharCode(key[1] === 'x'	? parseInt(key.substr(2), 16)
			: parseInt(key.substr(1), 10));
	}, replaceEntities = [
		HTML_ENTITY_RE,
		entityReplace
	];

String.REPLACE_HTML_ENTITIES = replaceEntities;
String.HTML_ENTITY_TABLE = HTML_ENTITY_TABLE;
String.prototype.htmlEntityDecode = function () {
	return this.replaceAll(replaceEntities);
};

var HTML_BLOCK_TAGS = [
	//Paragraph boundaries are inserted at every block-level HTML tag. Namely, those are (as taken from HTML 4 standard)
	'address', 'blockquote', 'caption', 'center', 'dd', 'div', 'dl', 'dt', 'h[1-6]', 'hr', 'li', 'menu', 'ol', 'p', 'pre', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
	//HTML5
	'article', 'aside', 'audio', 'canvas', 'figcaption', 'figure', 'footer', 'header', 'hgroup', 'output', 'progress', 'section', 'video',
	//Extended
	'form', 'title', 'br'
].join('|');

var HTML_PAIR_TAGS_WITH_CONTENT = [
	'script', 'style', 'map', 'iframe', 'frameset', 'object', 'applet', 'comment', 'button', 'textarea', 'select'
].join('|');

var htmlBlockTagsRe = new RegExp('^<('+ HTML_BLOCK_TAGS + ')\\b', 'i'),
	REPLACE_TAGS_AND_SPACES = [

		/*new XRegExp(HTML_TAG_RE, 'xsig')*/
		/(?:<(?=[a-z])(script|style|map|iframe|frameset|object|applet|comment|button|textarea|select)\b[\s\S]*?<(?!script\b)(?=(\/?))\2\1(?:[^>"']+|"[^"]*"|'[^']*')*>|<(?=[a-z])(?!(?:script|style|map|iframe|frameset|object|applet|comment|button|textarea|select)\b)(?:[^>"']+|"[^"]*"|'[^']*')*>|<\/[a-z](?:[^>"']+|"[^"]*"|'[^']*')*>|<![a-z](?:[^>"']+|"[^"]*"|'[^']*')*>|<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<%[\s\S]*?%>)/gi,
		function (str, entry) {
			if (str.search(htmlBlockTagsRe) > -1) return '\n';
			return '';
		},

		replaceEntities,

		//remove a duplicate spaces
		/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '', //It's just trim: https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
		/\r/g, '\n',
		/\t+/g, ' ',
		/\x20\x20+/g, ' ',
		//remove a spaces before and after new lines
		/\n\x20/g, '\n',
		/\x20\n/g, '\n',
		//replace 3 and more new lines to 2 new lines
		/\n\n\n+/g, '\n\n'
	];

var replaceTagsAndSpaces = [REPLACE_TAGS_AND_SPACES, /[\uFEFF\xA0]/ig, ' ', /\s{2,}/g, ' ', /^\s+|\s+$/g, ''],
	replaceFloat = [/[\u2212\u2013\u2014–]/ig, '-', /\s+/g, '', /'/g, '', /,/g, '.', /\.([^.]*)(?=\.)/g, '$1', /^\./, '0.', /,/, '.'],
	replaceSlashes = [/\\(.?)/g, function (str, n) {
		switch (n) {
			case '0':
				return '\0';
			case '':
				return '';
			default:
				return n;
		}
	}],
	replaceHtmlEntities = String.REPLACE_HTML_ENTITIES;

String.prototype.replaceAll = function(replaces) {
	var value = this, i;
	for (i = 0; replaces && i < replaces.length; ++i) {
		if (isArray(replaces[i])) {
			value = value.replaceAll(replaces[i]);
		} else {
			value = value.replace(replaces[i], replaces[i + 1]);
			++i; //Пропускаем ещё один элемент, использованный в качестве замены
		}
	}
	return value.valueOf();
}


function joinObjects(newObject, oldObject) {
	var obj = {};
	for (var i in oldObject) {
		obj[i] = oldObject[i];
	}
	if (newObject) {
		for (i in newObject) {
			obj[i] = newObject[i];
		}
	}
	return obj;
}

function joinArrays(arr1, arr2) {
	var narr = arr1.slice();
	narr.push.apply(narr, arr2);
	return narr;
}

function isset(v) {
	return typeof(v) != 'undefined';
}

function isArray(arr) {
	return Object.prototype.toString.call(arr) === '[object Array]';
}

function replaceAll(value, replaces) {
	if (!replaces) return value;
	if (typeof value != 'string')
		value += '';
	return value.replaceAll(replaces);
}

function parseBalance(text) {
	var val = getParam(replaceAll(text, [/\s+/g, '']), /([\u2212\u2013\u2014–\-]?[.,]?\d[\d'.,]*)/, replaceFloat);
	return val;
}

function parseCurrency(text) {
	var val = getParam(text.replace(/\s+/g, ''), /-?\d[\d.,]*(\S*)/);
	return val;
}

function getRecursiveMatch(html, reStart, reEnd, replaces, parseFunc) {
	var amatch = reStart.exec(html);
	if (!amatch)
		return;

	var startIndex = amatch.index;

	var depth = 0;
	var reStartOrEnd = new RegExp('(?:' + reStart.source + ')|(?:' + reEnd.source + ')', 'ig');
	var reStartWithEnd = new RegExp('^(?:' + reEnd.source + ')', reEnd.ignoreCase ? 'i' : '');

	reStartOrEnd.lastIndex = startIndex + amatch[0].length;

	while (true) {
		amatch = reStartOrEnd.exec(html);
		if (!amatch)
			break;
		var matched = amatch[0];
		if (reStartWithEnd.test(matched)) { //Закрывающий тег
			if (depth == 0)
				break;
			--depth;
		} else {
			++depth;
		}
		reStartOrEnd.lastIndex = amatch.index + matched.length;
	}

	var endIndex = html.length;
	if (amatch)
		endIndex = amatch.index + amatch[0].length;

	reStart.lastIndex = endIndex;

	var str = html.substring(startIndex, endIndex);

	if (replaces)
		str = replaceAll(str, replaces);
	if (parseFunc && typeof parseFunc == 'function')
		str = parseFunc(str);
	return str;
}

function n2(n) {
	return n < 10 ? '0' + n : '' + n;
}

function crc32(str) {
	function makeCRCTable(){
		var c;
		var crcTable = [];
		for(var n =0; n < 256; n++){
			c = n;
			for(var k =0; k < 8; k++){
				c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
			}
			crcTable[n] = c;
		}
		return crcTable;
	}

	var crcTable = makeCRCTable();
	var crc = 0 ^ (-1);

	for (var i = 0; i < str.length; i++ ) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
}

function luhnGet(num) {
	var arr = [],
		num = num.toString();
	for(var i = 0; i < num.length; i++) {
		if(i % 2 === 0) {
			var m = parseInt(num[i]) * 2;
			if(m > 9) {
				arr.push(m - 9);
			} else {
				arr.push(m);
			}
		} else {
			var n = parseInt(num[i]);
			arr.push(n)
		}
	}

	var summ = arr.reduce(function(a, b) { return a + b; });
	return (summ % 10);
}

function fmtDate(dt, delimiter) {
	if (!isset(delimiter))
		delimiter = '.';

	return getFormattedDate({format: 'DD' + delimiter + 'MM' + delimiter + 'YYYY'}, dt);
}

function getFormattedDate(options, dt) {
	if (!dt)
		dt = new Date();
	if (!options || typeof options == 'string')
		options = {format: options};
	if(!options.format)
		options.format = 'DD.MM.YYYY';

	//Формируем дату со смещением
	dt = new Date(dt.getFullYear() - (options.offsetYear || 0), dt.getMonth() - (options.offsetMonth || 0), dt.getDate() - (options.offsetDay || 0));
	var day = dt.getDate();
	var month = (dt.getMonth() + 1);
	var year = dt.getFullYear();

	return replaceAll(options.format, [
		/DD/, n2(day), /D/, day,
		/MM/, n2(month), /M/, month,
		/YYYY/, year, /YY/, (year + '').substring(2, 4)
	]);
}

function html_entity_decode(string) {
	return string.htmlEntityDecode();
}

function parseToFloat(str) {
	var res = isNaN(num = parseFloat(str.replaceAll([',', '.']))) ? 0 : num;
	//ZenMoney.trace('ParseToFloat("'+str+'") = '+res);
	return res;
}

function parseToInt(str) {
	//ZenMoney.trace('ParseToInt: '+str);
	return isNaN(num = parseInt(str)) ? 0 : num;
}

function getElement(html, re, replaces, parseFunc) {
	var amatch = re.exec(html);
	if (!amatch)
		return;
	var startIndex = amatch.index;
	var startTag = amatch[0];
	if (amatch[1] && (amatch[0].indexOf(amatch[1], amatch[0].length - amatch[1].length) > 0)) {
		startIndex += amatch[0].length - amatch[1].length;
		startTag = amatch[1];
	}
	var elem = getParam(startTag, /<(\w+)/);
	var reStart = new RegExp('<' + elem + '[^>]*>', 'ig');
	var reEnd = new RegExp('<\/' + elem + '[^>]*>', 'ig');
	reStart.lastIndex = startIndex;
	elem = getRecursiveMatch(html, reStart, reEnd, replaces, parseFunc);
	re.lastIndex = reStart.lastIndex;
	return elem;
}

function getElementByTag(html, tags, replaces, parseFunc) {
	if (!html)
		return;

	tags = isArray(tags) ? tags : [tags];

	var tag = tags[0];
	tags = tags.slice(1);
	var t1 = '<'+tag+'>';
	var t2 = '</'+tag+'>';

	var pos = html.indexOf(t1);
	if (pos < 0)
		return;

	var pos2 = html.indexOf(t2, pos+t1.length);
	if (pos2 < 0)
		return;

	var elem = html.substring(pos+t1.length, pos2);

	if (tags.length > 0) {
		//ZenMoney.trace(elem);
		elem = getElementByTag(elem, tags, replaces, parseFunc);
	}

	if (tags.length == 0) {
		if (replaces)
			elem = replaceAll(elem, replaces);

		if (parseFunc && typeof parseFunc == 'function') {
			elem = parseFunc(elem);
		}
	}

	return elem;
}

function getElementsByTag(html, tag, replaces, parseFunc) {
	var t1 = '<'+tag+'>';
	var t2 = '</'+tag+'>';
	var res = [];

	var pos = html.indexOf(t1);
	while(pos >= 0) {
		var pos2 = html.indexOf(t2, pos+t1.length), elem;

		if (pos2 >= 0)
			elem = html.substring(pos+t1.length, pos2);
		else
			break;

		if (replaces)
			elem = replaceAll(elem, replaces);

		if (parseFunc && typeof parseFunc == 'function')
			elem = parseFunc(elem);

		res.push(elem);
		pos = html.indexOf(t1, pos2+t2.length);
	}

	return res;
}

function getParam(html, regexp, replaces, parser) {
	if (!isset(html)) {
		ZenMoney.trace('getParam по пустому тексту! ' + new Error().stack);
		return;
	}
	var regexps = isArray(regexp) ? regexp : [regexp], value;
	for (var i = 0; i < regexps.length; ++i) { //Если массив регэкспов, то возвращаем первый заматченный
		regexp = regexps[i];
		var matches = regexp ? html.match(regexp) : [, html];
		if (matches) {
			value = replaceAll(isset(matches[1]) ? matches[1] : matches[0], replaces);
			if (parser && typeof parser == 'function')
				value = parser(value);
			break;
		}
	}
	return value;
}

function getParams(html, regexp, replaces, parser) {
	//ZenMoney.trace('getParams: '+html);
	if (!isset(html)) {
		ZenMoney.trace('getParam по пустому тексту! ' + new Error().stack);
		return;
	}

	var regexps = isArray(regexp) ? regexp : [regexp], value = [];
	for (var i = 0; i < regexps.length; ++i) { //Если массив регэкспов, то возвращаем первый заматченный
		regexp = regexps[i];
		var matches = regexp ? html.match(regexp) : [, html];
		if (matches) {
			for(var k = 0; k < matches.length; k++) {
				var str = replaceAll(matches[k], replaces);
				if (parser && typeof parser == 'function')
					str = parser(str);
				value.push(str);
			}
			break;
		}
	}
	return value;
}

function getParamByName(html, name) {
	return getParam(html, new RegExp('name=["\']' + name + '["\'][^>]*value=["\']([^"\']+)["\']', 'i'));
}

function addHeaders(newHeaders, oldHeaders) {
	oldHeaders = oldHeaders || g_headers;
	var bOldArray = isArray(oldHeaders);
	var bNewArray = isArray(newHeaders);
	if (!bOldArray && !bNewArray)
		return joinObjects(newHeaders, oldHeaders);
	if (bOldArray && bNewArray) //Если это массивы, то просто делаем им join
		return joinArrays(oldHeaders, newHeaders);
	if (!bOldArray && bNewArray) { //Если старый объект, а новый массив
		var headers = joinObjects(null, oldHeaders);
		for (var i = 0; i < newHeaders.length; ++i)
			headers[newHeaders[i][0]] = newHeaders[i][1];

		return headers;
	}
	if (bOldArray && !bNewArray) { //Если старый массив, а новый объект, то это специальный объект {index: [name, value], ...}!
		var headers = oldHeaders.slice();
		for (i in newHeaders)
			headers.push([i, newHeaders[i]]);
		return headers;
	}
}
