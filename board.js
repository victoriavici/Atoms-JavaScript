var Board = function(players, draw) {
	this.DELAY = 200;
	this.onTurnDone = function() {}; 

	this._draw = draw;
	this._data = {};
	this._criticals = [];

	this._players = players;
	this._score = [];
	for (var i = 0; i < players.length; i++) {
		 this._score.push(0);
	}

	this._build();
}

Board.prototype.getState = function() {
	return {
		score: this._score,
		data: this._data
	}
}

Board.prototype.setState = function(state) {
	this._score = state.score;
	this._data = state.data;

	for (var p in this._data) {
		var cell = this._data[p];
		var player = this._players[cell.player];

		var xy = XY.fromString(p);
		this._draw.cell(xy, cell.atoms, player);
	}
}

Board.prototype.clone = function() {
	var clone = new Board(this._players, null);

	clone._score = this._score.slice(0);

	for (var p in this._data) {
		var ourCell = this._data[p];
		var cloneCell = clone._data[p];
		cloneCell.atoms = ourCell.atoms;
		cloneCell.player = ourCell.player;
	}

	return clone;
}

Board.prototype.getPlayer = function(xy) {
	var index = this._data[xy].player;
	return (index == -1 ? null : this._players[index]);
}

Board.prototype.getAtoms = function(xy) {
	return this._data[xy].atoms;
}

Board.prototype.addAtom = function(xy, player) {
	this._addAndCheck(xy, player);

	if (Game.isOver(this._score)) {
		this.onTurnDone();
	} else if (this._criticals.length) {
		this._explode();
	} else { 
		this.onTurnDone();
	}
}

Board.prototype._addAndCheck = function(xy, player) {
	var cell = this._data[xy];

	if (cell.player != -1) { 
	this._score[cell.player]--;
}

	var playerIndex = this._players.indexOf(player);
	this._score[playerIndex]++;

	cell.player = playerIndex;
	cell.atoms++;

	if (this._draw) {
		this._draw.cell(xy, cell.atoms, player);
	}

	if (cell.atoms > cell.limit) {
		for (var i = 0; i < this._criticals.length; i++) {
			var tmp = this._criticals[i];
			if (tmp.equals(xy)) {
				 return;
				 }
		}
		this._criticals.push(xy);
	}
}

Board.prototype._explode = function() {
	var xy = this._criticals.shift();
	var cell = this._data[xy];

	var player = this._players[cell.player];
	
	var neighbors = xy.getNeighbors();
	cell.atoms -= neighbors.length;
	if (this._draw) {
		this._draw.cell(xy, cell.atoms, player);
	}

	for (var i = 0; i < neighbors.length; i++) {
		this._addAndCheck(neighbors[i], player);
	}

	if (Game.isOver(this._score)) {
		this.onTurnDone();
	} else if (this._criticals.length) {
		if (this._draw) {
			setTimeout(this._explode.bind(this), this.DELAY);
		} else {
			this._explode();
		}
	} else {
		this.onTurnDone();
	}
}

Board.prototype._build = function() {
	for (var i = 0; i < Game.SIZE; i++) {
		for (var j = 0; j < Game.SIZE; j++) {
			var xy = new XY(i, j);
			var limit = this._getLimit(xy);
			var cell = {
				atoms: 0,
				limit: limit,
				player: -1
			}
			this._data[xy] = cell;
		}
	}
}

Board.prototype.getScoreFor = function(player) {
	var index = this._players.indexOf(player);
	return this._score[index];
}

Board.prototype._getLimit = function(xy) {
	return xy.getNeighbors().length;
}
