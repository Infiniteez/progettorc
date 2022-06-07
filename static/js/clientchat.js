$(document).ready(function () {
	var chatSocket = io('/ciao', {transports: ['websocket']});

	chatSocket.on('chat', function (message) {
		message = JSON.parse(message)
		aggiornaVista(message)
	});

	function aggiornaVista(message) {
		var current = new Date();
		var time = {
			giorno: (current.getDate() < 10 ? '0' : '') + current.getDate(),
			mese: (current.getMonth() < 10 ? '0' : '') + current.getMonth(),
			ore: (current.getHours() < 10 ? '0' : '') + current.getHours(),
			minuti: (current.getMinutes() < 10 ? '0' : '') + current.getMinutes(),
		};
		var timeStr = time.giorno + '/' + time.mese + '\n' + time.ore + ':' + time.minuti;
		var messaggioHTML = '' +
			'<li class="left clearfix">' +
			'	<span class="chat-img pull-left">' +
			'		<img src="https://bootdey.com/img/Content/user_3.jpg" alt="User Avatar">' +
			'	</span>' +
			'	<div class="chat-body clearfix">' +
			'		<div class="header">' +
			'			<strong class="primary-font">' + message.name + '</strong>' +
			'			<small class="pull-right text-muted"><i class="fa fa-clock-o"></i> ' + timeStr + '</small>' +
			'		</div>' +
			'		<p>' + message.message + '</p>' +
			'	</div>' +
			'</li>';

		$('.chat-feed').append(messaggioHTML)
	}

	$('#chatForm').on('submit', function (e) {
		e.preventDefault()
		var data = $('#chatForm').serialize()
		$('#message').val("");
		$.ajax({
			type: 'POST',
			url: '/api/chat',
			processData: false,
			data: data
		})
	})
});