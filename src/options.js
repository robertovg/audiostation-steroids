/**
 * Audio Station Steroids
 * @autor robertovg24@gmail.com - robertovg.com
 *
 * Script for options page 
 */
(function() {
	Steroids.Views.Config = Backbone.View.extend({
		el: '#panel',
		initialize: function() {
			this.timesToTry = 100;
			this.tries = Math.round( this.timesToTry * 0.98 );
			vent.on('Steroids:authorizeFired', this.checkStatus, this);
			vent.on('Steroids:authorizeDone', this.authorizeDone, this);
			vent.on('Steroids:uuidNonExistent', this.askForUUID, this);
			vent.on('Steroids:showProgress', this.showProgress, this);
			vent.on('Steroids:showAuthorization', this.showAuthorization, this);
			vent.on('Steroids:serverNotRunning', this.showError, this);
			vent.on('Steroids:keepTrying', this.keepTrying, this);
			vent.on('Steroids:authorize', this.authorize, this);
			if(this.model.get('uuid')) {
				//Only try once
				vent.trigger('Steroids:authorizeFired');
			}else{
				vent.trigger('Steroids:uuidNonExistent');
			}
		},
		events: {
			'click #configForm button': 'preAutorize',
			'click #upAndRunning button': 'disallow'
		},
		askForUUID: function() {
			var _self = this,
			req = $.ajax({
					url: this.model.get('server_url') + '/uuid',
					cache: false
				});
				req.done(function(data) {
					if(data.uuid){
						_self.model.set('uuid', data.uuid);
						_self.preRender();
					}
				});
				req.fail(function(data) {
					vent.trigger('Steroids:showProgress');
					vent.trigger('Steroids:keepTrying', 'Steroids:uuidNonExistent', 'Steroids:serverNotRunning');
				});
		},
		keepTrying: function(ventOK, ventFail) {
			if(this.tries < this.timesToTry ) {
				this.tries++;
				setTimeout(function() {
					vent.trigger(ventOK);
				}, 3000);
			} else{
				vent.trigger(ventFail);
			}
		},
		checkStatus: function() {
			vent.trigger('Steroids:showProgress');
			if(this.tries === 0) {
				this.$el.find('.messagePanel').hide();
				this.$el.find('#loading').show();
			}
			var req = $.ajax({
					url: this.model.get('server_url') + '/session/' + this.model.get('uuid') + '/',
					cache: false
				});
			req.done(function(data) {
				if(data.status === 'done') {
					vent.trigger('Steroids:authorizeDone');
				}else if(data.status === 'working'){
					setTimeout(function() {
						vent.trigger('Steroids:authorizeFired');
					}, 3000);
				}else if(data.status === 'non-existent') {
					vent.trigger('Steroids:keepTrying', 'Steroids:authorizeFired', 'Steroids:uuidNonExistent');
				}
			});
			req.fail(function(data) {
					vent.trigger('Steroids:keepTrying', 'Steroids:authorizeFired', 'Steroids:uuidNonExistent');
			});
		},
		showError: function() {
			this.$el.find('#loading').hide();
			this.$el.find('#gatewayNotRunning').show();
		},
		preRender: function() {
			this.$el.find('#loading').hide();
			this.render();
		},
		render: function() {
			this.$el.find('.messagePanel').hide();
			if(this.model.get('userName')){
				vent.trigger('Steroids:showAuthorization');
			}else{
				this.$el.find('#configForm').show();
				this.tries = 0;
			}
			vent.trigger('Steroids:showProgress');

			return this;
		},
		showProgress: function() {
			var progress = this.tries * 100 / this.timesToTry;
			$('#progressBar').css('width', progress + '%');
		},
		preAutorize: function() {
			var dfd = this.model.save();
			dfd.done(function() {
				vent.trigger('Steroids:authorize');
			});
		},
		authorize: function() {
			var urlToSend = this.model.get('server_url') + '/token/put' +
				'/' + this.model.get('uuid');
			var urlLF = this.model.get('lastfm_url') +
				'?'	+ this.model.get('api_name') + '=' + this.model.get('api_key') +
				'&cb=' + urlToSend;
			window.open( urlLF );
			vent.trigger('Steroids:authorizeFired');
		},
		disallow: function() {
			this.model.set('uuid', '');
			this.model.set('userName', '');
			var dfd = this.model.save();
			dfd.done(function() {
				chrome.extension.sendMessage({method: "Steroids:gotDown"});
				vent.trigger('Steroids:uuidNonExistent');
			});

		},
		authorizeDone: function() {
			var _self = this;
			if(this.model.get('userName')) {
				vent.trigger('Steroids:showAuthorization');
			}else {
				var req	= $.ajax(this.model.get('server_url') +
					'/token/' + this.model.get('uuid') + '/');
				req.done(function(data) {
					_self.model.set('userName', data.userName);
					var dfd = _self.model.save();
					dfd.done(function() {
						vent.trigger('Steroids:showAuthorization');
					});
				});
			}
		},
		showAuthorization: function() {
			var upAndRunningContainer = this.$el.find('#upAndRunning'),
				texto = upAndRunningContainer.html();

			texto = texto.replace(/{{userName}}/, this.model.get('userName'));
			this.tries = this.timesToTry;
			vent.trigger('Steroids:showProgress');
			this.$el.find('.messagePanel').hide();
			upAndRunningContainer.html(texto);
			upAndRunningContainer.show();
		}

	});

	var config = new Steroids.Models.Config(
		{
			fillUserName: false
		}
	);
	config.fetch().then(function() {
		new Steroids.Views.Config({ model:config });
	});

})();
