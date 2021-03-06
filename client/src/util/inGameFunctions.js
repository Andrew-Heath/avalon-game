module.exports = {
  createFloor: function() {

    new THREE.TextureLoader().load('images/in-game/avalon-board.jpg', (floorTexture) => {
      let floorMaterial = new THREE.MeshPhongMaterial({ map: floorTexture });
      let floorGeometry = new THREE.BoxGeometry(550, 10, 550);

      let floor = new THREE.Mesh(floorGeometry, floorMaterial);

      floor.position.y = -80;

      this.scene.add(floor);
    });

  },
  // Addition of all players at the beginning of the game
  // Expects an array of objects with uid and color property
  addAllPlayers: function(players, selfId) {
    // Create the order by adding everyone up to the selfId on the players
    // list to the end of the render order and everyone after the selfId
    // is found to the beginning of the render order
    let renderOrderLeft = [];
    let renderOrderRight = [];

    for (let x = 0, foundSelf = false; x < players.length; x++) {
      if (players[x].uid === selfId) {
        foundSelf = true;
      } else {
        (foundSelf ? renderOrderLeft : renderOrderRight).push(players[x]);
      }
    }

    let renderOrder = renderOrderLeft.concat(renderOrderRight);

    // Set coordinates for each player based on render order
    // Players will be in a circle around the central origin point, with 
    // the camera taking the place of the current player at 0 degrees

    let playersWithPositions = this.setCircleCoordinates(renderOrder, 250);

    for (let y = 0; y < playersWithPositions.length; y++) {
      console.log('circle pos inside playersWithPositions', playersWithPositions[y].pos);
      this.addPlayer(
        playersWithPositions[y].uid, 
        playersWithPositions[y].color, 
        null, 
        playersWithPositions[y].pos);
    }

  },
  // When a player joins the game
  addPlayer: function(uid, color, role, circlePos) {
    this.players.push({
      uid,
      x: 0,
      y: 0,
      color: this.roleColors['defaultColor'],
      role: this.roleColors['defaultColor'],
      pos: circlePos
    });      

    let sphereMaterial =
      new THREE.MeshLambertMaterial({
          color: this.roleColors['defaultColor']
      });
    let radius = 20,
        segments = 16,
        rings = 16;
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial);

    let body = new THREE.Mesh(
      new THREE.BoxGeometry(35, 65, 35),
      sphereMaterial);

    body.position.x = 0;
    body.position.y = -50;
    sphere.add(body);
    
    sphere.name = uid;
    sphere.position.x = 0;
    sphere.pos = circlePos;

    this.scene.add(sphere);
  },
  removePlayer: function(uid) {
    this.removeObject(uid);    
    for (let x = 0; x < this.players.length; x++) {
      if (this.players[x].uid === uid) {
        this.players.splice(x, 1);
      }
    }
  },
  // Assign roles attaches the roles of the game to the player objects
  assignRoles: function(party, id, role) {
    this.gameState.ownRole = party[id];
    if (role === 'MERLIN' || role === 'ASSASSIN' || role === 'MINION') {
      //Show minions as red to these characters
      for (let player in party) {
        if (player !== id) {
          if (party[player] === 'MINION' || party[player] === 'ASSASSIN') {
            for (let x = 0; x < this.players.length; x++) {
              if (this.players[x].uid === player) {
                this.players[x].color = this.roleColors['MINION'];
              }
            }
            this.scene.getObjectByName(player).material.color.setHex(this.roleColors['MINION']);
          }      
        }
      }
    }
  },
  // Allows the party leader to pick a party. 
  pickParty: function(sendPickedParty, partyNumber, name) {
    let pidsList = this.players.map(player => {
      return player.uid;
    });
    pidsList.push(name);
    console.log('name of user and pidslist', name, pidsList, this.players);
    this.addSelf(name);
    if (this.usingVR) {
      this.addVRPressEventListener('pickParty', partyNumber, sendPickedParty, {choices: pidsList});
    } else {
      this.addClickEventListener('pickParty', partyNumber, sendPickedParty, {choices: pidsList}); 
    }
  },
  // Shows all players who are voting on the party who was chosen as the party members
  partyMembers: function(partyMembers) {

  },
  // TODO: Pending field test to determine whether the buttons are well placed
  // at these new coordinates. 
  partyButtons: function(voteOnParty) {
    let textureLoader = new THREE.TextureLoader();

    textureLoader.load('images/in-game/approve.jpg', (approveTexture) => {
      this.addButton(
        'accept', 
        { map: approveTexture }, 
        { lenx: 64, leny: 64 , lenz: 64 }, 
        { posx: -50, posy: -40, posz: 0 }
      );

      textureLoader.load('images/in-game/reject.jpg', (rejectTexture) => {
        this.addButton(
          'reject', 
          { map: rejectTexture }, 
          { lenx: 64, leny: 64, lenz: 64 }, 
          { posx: 50, posy: -40, posz: 0 }
        );
      });
      
    });

    //All stages will have signs but not all stages will have buttons
    //Extend callback to remove buttons after choices have been made
    const votePartyCallback = (choice) => {
      voteOnParty(choice[0] === 'reject' ? false : true);
      
      this.removeObject('accept');
      this.removeObject('reject');      
    };

    if (this.usingVR) {
      this.addVRPressEventListener('approveParty', 1, votePartyCallback, {choices: ['accept', 'reject']});
    } else {
      this.addClickEventListener('approveParty', 1, votePartyCallback, {choices: ['accept', 'reject']});
    }
  },
  // TODO: Pending field tes to determine whether these buttons are
  // well placed at these coordinates 
  questButtons: function(voteOnQuest) {
    let textureLoader = new THREE.TextureLoader();

    textureLoader.load('images/in-game/success.jpg', (successTexture) => {
      this.addButton(
        'success', 
        { map: successTexture }, 
        { lenx: 64, leny: 64, lenz: 64 }, 
        { posx: -50, posy: -40, posz: 0 }
      );

      textureLoader.load('images/in-game/fail.jpg', (failTexture) => {
        this.addButton(
          'fail', 
          { map: failTexture }, 
          { lenx: 64, leny: 64, lenz: 64 }, 
          { posx: 50, posy: -40, posz: 0 }
        ); 
      });

    });


    //All stages will have signs but not all stages will have buttons
    //Extend callback to remove buttons after choices have been made
    const voteQuestCallback = (choice) =>{
      voteOnQuest(choice[0] === 'fail' ? false : true);
      //remove buttons
      this.removeObject('success');
      this.removeObject('fail');      
    };

    if (this.usingVR) {
      this.addVRPressEventListener('passQuest', 1, voteQuestCallback, {choices: ['success', 'fail']});
    } else {
      this.addClickEventListener('passQuest', 1, voteQuestCallback, {choices: ['success', 'fail']});
    }
  },
  addTokens: function(qResult, round, scene) {
    let imageSrc = 'images/in-game/' + (qResult === 'SUCCESS' ? 'succeeded' : 'failed') + '.jpg';
    let material = new THREE.MeshPhongMaterial({map: THREE.ImageUtils.loadTexture(imageSrc)});

    let token = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 10), material);

    token.position.x = -250 + (round * 35);
    token.position.y = 15;
    token.position.z = 10;

    scene.add(token);

  },
  stabMerlin: function(sendPickedMerlin) {
    var players = [];
    for(let i = 0; i < this.players.length; i++) {
      players.push(this.players[i].uid)
    }
    this.addClickEventListener('stabMerlin', 1, sendPickedMerlin, {choices:players});
  }
};