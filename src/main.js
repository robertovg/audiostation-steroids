/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * File to declare app namespaces and commons utils 
 */
(function() {
	window.Steroids = {
		Models: {},
		Collections: {},
		Views: {},
		Router: {}
	};

	window.template = function(id){
		return _.template( $('#' + id).html() );
	};

	window.vent = _.extend({}, Backbone.Events);
})();
