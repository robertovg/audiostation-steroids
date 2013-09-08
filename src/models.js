/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * Where all commons models are declared
 */
(function(chrome) {

	Steroids.Models.Config = Backbone.Model.extend({
		idAttribute: "uuid",
		defaults: {
			uuid: "",
			userName: "",
			api_name: "api_key",
			api_key: "10b508301c48be78f06b0107faa66c4c",
			lastfm_url: "http://www.last.fm/api/auth/",
			server_url: "https://steroids-gateway.eu01.aws.af.cm",
			uuid_key: "uuid",
			fillUserName: true
		},
		sync: function(method, model) {
			var _self = this,
				dfd = $.Deferred();
			switch(method) {
				case 'create':
					//Don't used!
					dfd.resolve();
				break;
				case 'read':
					chrome.storage.sync.get(['uuid', 'userName'], function( val ) {
						_self.set('uuid', val.uuid);
						if(_self.get('fillUserName')) {
							_self.set('userName', val.userName);
						}
						dfd.resolve();
					});
				break;
				case 'update':
					chrome.storage.sync.set({'uuid': this.get('uuid'), 'userName': this.get('userName')}, function() {
							dfd.resolve();
					});
				break;
				case 'remove':
					chrome.storage.sync.remove(['uuid', 'userName'], function() {
						dfd.resolve();
					});
				break;

			}
			return dfd.promise();
		}
	});

	Steroids.Models.Song = Backbone.Model.extend({
		defaults: {
			title: '',
			artist: '',
			album: '',
			position: 0,
			duration: 0,
			sent: false
		},
		constructor: function( data, opts )	{
			if( isNaN(data.position) ) {
				data.position = this.dateToSeconds(data.position);
			}
			if( isNaN(data.duration) ) {
				data.duration = this.dateToSeconds(data.duration);
			}
			if( !data.timestamp ) {
				var now = new Date();
				data.timestamp = Math.round( now.getTime() / 1000 ) - data.position;
			}
			Backbone.Model.prototype.constructor.call(this, data, opts);
		},
		halfPlayed: function() {
			var resul = false;
			if(this.get('position') && this.get('duration')) {
				resul = (this.get('position') / this.get('duration')) > 0.5;
			}
			return resul;
		},
		hasStarted: function() {
			return this.get('position');
		},
		dateToSeconds: function( dateStr ) {
			var resul = 0,
				hours = 0,
				minutes = 0,
				seconds = 0;
			if(dateStr && /^([0-9]{1,2})[:]([0-9]{1,2})[:]([0-9]{2})$/.test(dateStr)) {
				var splited = dateStr.split(':');
				hours = parseInt(
					splited[0], 10
				);
				minutes = parseInt(
					splited[1], 10
				);
				seconds = parseInt(
					splited[2], 10
				);
			}

			if(dateStr && /^([0-9]{1,2})[:]([0-9]{2})$/.test(dateStr)) {
				minutes = parseInt(
					dateStr.substring( 0, dateStr.indexOf(':') ),
					10
				);
				seconds = parseInt(
					dateStr.substring( dateStr.indexOf(':') + 1, dateStr.length),
					10
				);
			}
			resul = parseInt((minutes * 60), 10) + parseInt(seconds, 10);
			return resul;
		},
		sended: function() {
			this.set('sent', true);
		},
		alreadySent: function () {
			return this.get('sent');
		}
	});
})(chrome);
