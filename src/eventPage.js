/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * Here is where scrobbles are sent to the gateway, is like
 * old backgrounds.js but more efficient
 * 
 */
(function() {

	Steroids.Views.Icon = Backbone.View.extend({
		initialize: function() {
			vent.on('Steroids:upAndRunning', this.setUpAndRunning, this);
			vent.on('Steroids:gotDown', this.getDown, this);
		},
		setUpAndRunning: function()	{
			chrome.browserAction.setIcon({ path: 'img/audio_station_24.png'});
		},
		getDown: function() {
			localStorage.clear();
			chrome.browserAction.setIcon({ path: 'img/audio_station_bn.png'});
		}
	});

	Steroids.Views.Commiter = Backbone.View.extend({
		initialize: function() {
			vent.on('Steroids:nowListening', this.commitNowListening, this);
			vent.on('Steroids:scrobbling', this.commitScrobbling, this);
			vent.on('Steroids:pushSong', this.pushSong, this);
		},
		commitNowListening: function( scrobble ) {
			//try to commit the song, otherwise just nothing
			var updateNowSong = new Steroids.Models.Song(scrobble);
			var req = $.ajax({
				type: 'post',
				url: this.model.get('server_url') + '/updateNow',
				cache: false,
				data: {
					uuid: this.model.get('uuid'),
					album: scrobble.album,
					artist: scrobble.artist,
					track: scrobble.title
				}
			});
			req.done(function(data) {
				if(data.uuid){
				}
			});
			req.fail(function( data ) {
			});
		},
		commitScrobbling: function( scrobble ) {
			//try to commit the song, otherwise store it 
			var scrobblingSong = new Steroids.Models.Song(scrobble);
			var req = $.ajax({
				type: 'post',
				url: this.model.get('server_url') + '/scrobble',
				cache: false,
				data: {
					uuid: this.model.get('uuid'),
					album: scrobble.album,
					artist: scrobble.artist,
					track: scrobble.title,
					timestamp: scrobble.timestamp
				}
			});
			req.done(function(data) {
				if(data.uuid){
				}
			});
			req.fail(function( data ) {
			});
		},
		pollForScrobblingsFailed: function() {
			//it will be called in intervals, will try to commit all things
		}
	});

	Steroids.Views.App = Backbone.View.extend({
		initialize: function() {
			chrome.extension.onMessage.addListener(this.messageRouter);

			vent.on('Steroids:loadScripts', this.loadScripts, this);

		},
		messageRouter: function(request, sender, sendResponse) {
			switch(request.method){
				//When it recibes an script with this method requested, it loads these libs
				case 'Steroids:loadScripts':
					vent.trigger('Steroids:loadScripts', sender.tab.id, sendResponse);
				break;
				case 'Steroids:upAndRunning':
					vent.trigger('Steroids:upAndRunning');
				break;
				case 'Steroids:gotDown':
					vent.trigger('Steroids:gotDown');
				break;
				case 'Steroids:nowListening':
					vent.trigger('Steroids:nowListening', request.scrobble);
				break;
				case 'Steroids:scrobbling':
					vent.trigger('Steroids:scrobbling', request.scrobble);
				break;

			}
			return true;
		},
		loadScripts: function( id , sendResponse) {
			var dfdJquery = $.Deferred(),
			dfdUnderscore = $.Deferred(),
			dfdBackbone = $.Deferred(),
			dfdMain = $.Deferred(),
			dfdModels = $.Deferred(),
			dfdContentSteroids = $.Deferred();
			chrome.tabs.executeScript(
				id, { file: 'lib/jquery.js' }, function() {
					dfdJquery.resolve();
				}
			);
			dfdJquery.done(function() {
				chrome.tabs.executeScript(
					id, { file: 'lib/underscore.js' }, function() {
						dfdUnderscore.resolve();
					}
				);
			});
			dfdUnderscore.done(function() {
				chrome.tabs.executeScript(
					id, { file: 'lib/backbone.js' }, function() {
						dfdBackbone.resolve();
					}
				);
			});
			dfdBackbone.done(function() {
				chrome.tabs.executeScript(
					id, { file: 'src/main.js' }, function() {
						dfdMain.resolve();
					}
				);
			});
			dfdMain.done(function() {
				chrome.tabs.executeScript(
					id, { file: 'src/models.js' }, function() {
						dfdModels.resolve();
					}
				);
			});
			dfdModels.done(function() {
				chrome.tabs.executeScript(
					id, { file: 'src/contentSteroids.js' }, function() {
						dfdContentSteroids.resolve();
					}
				);
			});
			$.when(dfdJquery, dfdUnderscore, dfdBackbone, dfdMain, dfdModels, dfdContentSteroids )
				.done( function() {
					sendResponse( { status:'Steroids:ScritpsLoaded' } );
				})
				.fail( function() {
					sendResponse( { status:'Steroids:SomethingFailed' } );
				})
			;
		}
	});

	var config = new Steroids.Models.Config();

	config.fetch().then(function() {
		new Steroids.Views.Icon();
		new Steroids.Views.App();
		new Steroids.Views.Commiter({ model: config });
	});

})();
