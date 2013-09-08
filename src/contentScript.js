/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * ContentScript is in charge only of programmatic injection
 * 
 */

(function() {
	var checkIfWeAreInDMS = function() {
		var form = document.getElementById("preview-form");

		if(form && /dsm.cgi/g.test(form.action) ){
			chrome.extension.sendMessage({method: "Steroids:loadScripts"}, function(res) {
						if(res && res.status) {
						} else {
							setTimeout(checkIfWeAreInDMS, 3000);
						}
				});
		}
	};
	checkIfWeAreInDMS();
})();