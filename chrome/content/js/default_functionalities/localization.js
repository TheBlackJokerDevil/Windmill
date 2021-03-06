/*-- Lokalisierungsfunktionen --*/

function Locale(str, prefix, ...pars) {
	if(!prefix && prefix !== "")
		prefix = MODULE_LPRE;

	if(prefix == -1)
		prefix = "";

	if(!str)
		return str;


	var lgreplace = str.match(/\$[a-zA-Z0-9_]+?\$/g);
	for(var d in lgreplace) {
		var id = lgreplace[d];
		var str2 = __l[prefix+"_"+id.match(/\$([a-zA-Z0-9_]+?)\$/)[1]];
		
		if(str2)
			str = str.replace(RegExp(id.replace(/\$/g, "\\$")), str2.replace(/\\n/, "\n"));
	}

	if(arguments.length > 2)
		return sprintf(str, ...pars);

	return str;
}

function localizeModule() {
	let rgx = /\$(::)?[a-zA-Z0-9_]+?\$/g;

	function getReplacement(lgreplace) {
		let replacement = __l[MODULE_LPRE+"_"+lgreplace.replace(/\$/g, "")];
		if(replacement)
			replacement.replace(/\\n/, "\n");

		return replacement;
	}

	function fnLocale(i, obj) {
		//Keine Lokalisierung
		if($(obj).attr("data-no-localization"))
			return;

		//Attribute durchgehen
		jQuery.each(obj.attributes, function(j, attr) {
			if(!$(obj).attr(attr.name))
				return;

			let match = $(obj).attr(attr.name).match(rgx);
			if(match) {
				$(obj).attr(attr.name, $(obj).attr(attr.name).replace(rgx, (match) => {
					if(getReplacement(match))
						return getReplacement(match);
					else
						return match;//$(obj).attr(attr.name, getReplacement(match[0]));
				}));
			}
		});

		//Textnodes durchgehen
		$(obj).contents().each(function() {
			if(this.nodeType == 3) {
				this.nodeValue = jQuery.trim($(this).text()).replace(rgx, (match) => {
					if(match.search(/^\$::/) != -1) {
						match = match.replace(/^\$::/, "$");
						let new_nodes = jQuery.parseHTML(getReplacement(match));
						for(let i = 0; i < new_nodes.length; i++) {
							this.parentNode.insertBefore(new_nodes[i], this);
						}
						this.parentNode.removeChild(this);
						return;
					}
					if(getReplacement(match))
						return getReplacement(match);
					else
						return match;
				});
			}
		});

		jQuery.each($(obj).children("*"), fnLocale);
	}

	if(MODULE_LANG == "html")
		jQuery.each($("body > *"), fnLocale);
	else if(MODULE_LANG == "xul")
		jQuery.each($(document.documentElement).children("*"), fnLocale);
}