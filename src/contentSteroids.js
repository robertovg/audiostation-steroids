/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * The Script loaded in Synology DMS tab 
 */
(function() {

	Steroids.Views.Daemon = Backbone.View.extend({
		el: null,
		actual: null,
		initialize: function() {
			vent.on('Steroids:startWatching', this.startWatching, this);
			vent.on('Steroids:watching', this.startWatching, this);
			vent.on('Steroids:startPolling', this.polling, this);
			vent.on('Steroids:polling', this.polling, this);
			vent.trigger('Steroids:startWatching');
		},
		//Wait until AudioStation is el attached
		startWatching: function() {
			if(this.isAudioStationRunning(this)){
				vent.trigger('Steroids:startPolling');
			}else {
				this.el = $('.syno-as-player-div').get(0);
				this.$el = $(this.el);
				setTimeout(function() {
					vent.trigger('Steroids:watching');
				}, 3000);
			}
		},
		polling: function() {
				if(this.isAudioStationRunning(this)) {
					var albumArtist = this.$el.find('.info-album-artist *').text().split(' - '),
					newSong = new Steroids.Models.Song({
						title: this.$el.find('.info-title *').text(),
						album: albumArtist[0],
						artist: albumArtist[1],
						position: this.$el.find('.info-position').text(),
						duration: this.$el.find('.info-duration').text()
					});
					if(!this.actual ||
						!this.songsEqual(newSong, this.actual)
						) {
						if(newSong.hasStarted() ) {
							if( this.actual ) {
								this.actual.destroy();
							}
							this.actual = newSong;
							vent.trigger('Steroids:commitNowListening', this.actual.attributes);
						}
					}else {
						if(!this.actual.alreadySent() && newSong.halfPlayed()) {
							this.actual.sended();
							vent.trigger('Steroids:commitScrobble', newSong.attributes);
						}
					}
					setTimeout(function() {
						vent.trigger('Steroids:polling');
					}, 3000);
				} else {
					vent.trigger('Steroids:startWatching');
				}
		},
		isAudioStationRunning: function(context) {
			var resul = false;
			if(context.el &&
				$.contains(context.el,$('.info-title *').get(0))){
				resul = this.$el.find('.info-position').text() != '--:--';
			}
			if(resul && $('#syno_as_mini_info_div').get(0)) {
				resul = false;
			}
			return resul;
		},
		songsEqual: function(song1, song2) {
			return _.isEqual(_.pick(song1.attributes,
						'title', 'artist', 'album'),
						_.pick(song2.attributes,
							'title', 'artist', 'album'
							)
						)
			;
		}
	});

	Steroids.Views.Sender = Backbone.View.extend({
		initialize: function() {
			vent.on('Steroids:startWatching', this.sendGotDown, this);
			$(window).on('unload', this.sendGotDown);
			vent.on('Steroids:startPolling', this.sendUpAndRunning, this);
			vent.on('Steroids:commitNowListening', this.sendNowListening, this);
			vent.on('Steroids:commitScrobble', this.sendScrobbling, this);
		},
		sendGotDown: function() {
			chrome.extension.sendMessage({ method: "Steroids:gotDown" });
		},
		sendUpAndRunning: function() {
			chrome.extension.sendMessage({
				method: "Steroids:upAndRunning"
			});
		},
		sendNowListening: function( scrobble ) {
			chrome.extension.sendMessage({
				method: "Steroids:nowListening",
				scrobble: scrobble
			});
		},
		sendScrobbling: function( scrobble ) {
			chrome.extension.sendMessage({
				method: "Steroids:scrobbling",
				scrobble: scrobble
			});
		}
	});

	var config = new Steroids.Models.Config();
	config.fetch().then(function() {
		if( config.get('uuid') && config.get('userName') ) {
			new Steroids.Views.Daemon({ model: config });
			new Steroids.Views.Sender();
		}
	});
})();
