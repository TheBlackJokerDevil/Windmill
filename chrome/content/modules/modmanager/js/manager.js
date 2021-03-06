
var modules = [];

window.addEventListener("load", function(){
	var mlist = _mainwindow.MODULE_LIST;
	for(var entry in mlist) {
		if(!mlist[entry] || $(mlist[entry]).attr("name") == "modmanager")
			continue;

		onModuleAdded(getModuleDef($(mlist[entry]).attr("name")), mlist[entry]);
	}

	var CONFIG = getConfig();
	for(var sect in CONFIG) {
		onConfigChange(sect, "", "");
		for(var key in CONFIG[sect]) {
			onConfigChange(sect, key, CONFIG[sect][key]);
		}
	}

	onConfigSave();

	setInterval(function() {
		$(".removedModule").remove();

		for(var entry in modules) {
			if(!modules[entry][1].contentWindow) {
				$(modules[entry][1]).remove();
				$("row#"+modules[entry][2]).addClass("removedModule");
			}
		}
	}, 2000);

	$("#lblbtn-save").click(function() {
		saveConfig();
	});
});

function onConfigChange(sect, key, val) {
	if(val.constructor.name == "ConfigEntry")
		val = val.tempvalue;
	if(!$("#config-"+sect+"-"+key)[0]) {
		let display_val = val;
		if(typeof val == "object")
			display_val = JSON.stringify(val);
		$("#config-overview").append(`<row id="config-${sect}-${key}" align="center">
				<label class="cfg-sect" value="${sect}" />
				<label class="cfg-key" value="${key}" />
				<hbox>
					<label class="cfg-val" value='${display_val}' />
				</hbox>
			</row>`);

		var obj = $("#config-"+sect+"-"+key);
		if(!key && !val)
			$(obj).addClass("configSection");
		if(val === false || val === true) {
			$(obj).addClass("boolean-val");
			$(obj).find(".cfg-val").click(function() {
				setConfigData(sect, key, !getConfigData(sect, key));
			});
		}
		else {
			$(obj).find(".cfg-val").click(function() {
				$(this).after('<textbox class="cfg-val-textbox"/>');
				$(this).css("display", "none");
				let cfgval = getConfigData(sect, key);
				if(typeof cfgval == "object")
					cfgval = JSON.stringify(cfgval);

				$(this).parent().find(".cfg-val-textbox").val(cfgval).focus();
				$(".cfg-val-textbox").blur(function() {
					setConfigData(sect, key, $(this).val());
					$(this).parent().find(".cfg-val").css("display", "block");
					$(this).remove();
				});
			});
		}

		$(obj).addClass("configChanged");
	}
	else {
		var obj = $("#config-"+sect+"-"+key);
		$(obj).find(".cfg-val").val(val);

		$(obj).addClass("configChanged");
	}

	return true;
}

function onConfigSave() {
	$(".configChanged").each(function() {
		var sect = $(this).attr("id").match(/config-(.+)?-.*/i)[1];
		var key = $(this).attr("id").match(/config-.+?-(.*)/i)[1];

		if(key) {
			if(_mainwindow.CONFIG[sect][key].value)
				if($(this).find(".cfg-val").val() == (_mainwindow.CONFIG[sect][key].value.toString()))
					$(this).removeClass("configChanged");
		}
		else
			$(this).removeClass("configChanged");
	});

	return true;
}

function onModuleAdded(def, modframe) {
	modules.push([def, modframe, modframe.id]);

	$("#module-overview").append('<row id="'+modframe.id+'" class="newModule"><label value="'+def.modulename+'"/></row>');
	$("#"+modframe.id).append('<label value="'+modframe.id+'"/>');
	$("#"+modframe.id).append('<hbox id="opt-'+modframe.id+'"></hbox>');

	$('<box class="btn-reload icon-16 icon-spinner11"/>')
		.appendTo($("#opt-"+modframe.id)).click(function() {
			var pars = "?";
			if(typeof modframe.contentWindow.getReloadPars == "function")
				pars += modframe.contentWindow.getReloadPars();

			modframe.contentWindow.location.replace(modframe.contentWindow.location.pathname+pars);
		});
	$('<box class="btn-inspect icon-16 icon-search" />')
		.appendTo($("#opt-"+modframe.id)).click(function() {
			modframe.contentWindow.ACTIVATE_INSPECTOR = !modframe.contentWindow.ACTIVATE_INSPECTOR;
			showDOMTree(modframe);
		});

	setTimeout(function() {
		$("row#"+modframe.id).removeClass("newModule");
	}, 2500);
}

function showDOMTree(modframe) {	
	var doc = modframe.contentDocument.documentElement, domcont = $("#dom-container");
	
	$(doc).html().replace(/<\/?[^>]+(>|$)/g, function(match) {
		var el = $('<description class="inspect-line"></description>');
		el.text(match);
		el.appendTo(domcont);
	});
}

function frameWindowTitle() {}

/*-- SASS --*/

hook("load", function() {
	let ssDefs = _mainwindow.getSASSDefList();
	for(let def of ssDefs) {
		$("#ss-deflist").append("<row id=\"ss-def-"+def.index+"\" align=\"center\">"+
			"<label value=\""+def.leafName+"\" flex=\"1\" />"+
			"<label value=\""+(def.observe || "Global")+"\" flex=\"1\"/>"+
			"<label class=\"update-date\" value=\"unknown\" flex=\"1\"/>"+
			"<button label=\"Generate CSS File\" onclick=\"_mainwindow.generateCssFile("+def.index+")\" />"+
		"</row>")
	}
	_mainwindow.hook("sass-target-updated", function(def, d) {
		$("#ss-def-" + def.index).find(".update-date")
			.attr("value", d.getHours() + ":" + (d.getMinutes()<10?'0':'') + d.getMinutes())
	});
});