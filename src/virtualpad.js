(function (Phaser) {
  'use strict';

  var buttonId = 0,
      base = (Math.PI / 8),
      UP_LOWER_BOUND = -7 * base,
      UP_UPPER_BOUND = -1 * base,
      DOWN_LOWER_BOUND = base,
      DOWN_UPPER_BOUND = 7 * base,
      RIGHT_LOWER_BOUND = -3 * base,
      RIGHT_UPPER_BOUND = 3 * base,
      LEFT_LOWER_BOUND = 5 * base,
      LEFT_UPPER_BOUND = -5 * base;

  Phaser.Plugin.VirtualPad = function (game, parent) {
    Phaser.Plugin.call(this, game, parent);

    this.input = this.game.input;
    this.stick = null;
    this.stickPad = null;
    this.stickPoint = null;
    this.stickRadius = null;
    this.stickPointer = null;
    this.buttons = {};
    this.buttonPoint = {};
    this.buttonRadius = {};
    this.preUpdate = gamepadPoll.bind(this);
  };

  Phaser.Plugin.VirtualPad.prototype = Object.create(Phaser.Plugin.prototype);
  Phaser.Plugin.VirtualPad.prototype.constructor = Phaser.Plugin.VirtualPad;

  Phaser.Plugin.VirtualPad.prototype.addPad = function(x, y, id, frame, scale) {
    if (this.stick !== null) {
      return null;
    }

    scale = scale || 1;

    this.stick = this.game.add.sprite(x, y, id, frame);
    this.stick.frame = 2;
    this.stick.isDown = false;
    this.stick.anchor.set(0.5);
    this.stick.fixedToCamera = true;
    this.stick.scale.setTo(scale, scale);

    this.stickPoint = new Phaser.Point(x, y);
    this.stick.properties = {
      inUse: false,
      up: false,
      down: false,
      left: false,
      right: false,
      x: 0,
      y: 0,
      distance: 0,
      angle: 0,
      rotation: 0
    };

    this.stickRadius = scale * (this.stick.width / 2);

    return this.stick;
  };

  Phaser.Plugin.VirtualPad.prototype.addButton = function(x, y, id, downFrame, upFrame, scale) {
    buttonId++;
    scale = scale || 1;
    var button = this.game.add.button(x, y, id, null, this, null, null, downFrame, upFrame);
    button.anchor.set(0.5);
    button.fixedToCamera = true;
    button.scale.setTo(scale, scale);
    button.isDown = false;

    this.buttons[buttonId] = button;
    this.buttonsPoint[buttonId] = new Phaser.Point(x, y);
    this.buttonsRadius[buttonId] = scale * (button.width / 2);
    return button;
  };

  Phaser.Plugin.VirtualPad.prototype.setDirectionActions = function(actions) {
    if (this.stick.hDirection === Phaser.LEFT) {
      if (actions.left) {
        actions.left.onDown();
        actions.right.onUp();
      }
    } else if (this.stick.hDirection === Phaser.RIGHT) {
      if (actions.right) {
        actions.right.onDown();
        actions.left.onUp();
      }
    }
    if (this.stick.vDirection === Phaser.UP) {
      if (actions.up) {
        actions.up.onDown();
        actions.down.onUp();
      }
    } else if (this.stick.vDirection === Phaser.DOWN) {
      if (actions.down) {
        actions.down.onDown();
        actions.up.onUp();
      }
    }
  };

  var gamepadPoll = function() {
    var resetJoystick = true;
    for (var id in this.buttons) {
      if (this.buttons.hasOwnProperty(id)) {
        var button = this.buttons[id];
        button.isDown = false;
        button.frame = 0;
      }
    }
    this.game.input.pointers.forEach(function(pointer) {
      resetJoystick = testDistance(pointer, this);
    }, this);

    resetJoystick = testDistance(this.game.input.mousePointer, this);

    if (resetJoystick) {
      if ((this.stickPointer === null) || (this.stickPointer.isUp)) {
        moveJoystick(this.stickPoint, this);
        this.stick.isDown = false;
        this.stickPointer = null;
      }
    }
  };

  var testDistance = function(pointer, that) {
    var reset = true,
        distance = that.stickPoint.distance(pointer.position);
    if ((pointer.isDown) && ((pointer === that.stickPointer) || (distance < that.stickRadius))) {
      reset = false;
      that.stick.isDown = true;
      that.stickPointer = pointer;
      moveJoystick(pointer.position, that);
    }

    for (var id in that.buttonsPoint) {
      if (that.buttonsPoint.hasOwnProperty(id)) {
        var buttonPoint = that.buttonsPoint[id];
        distance = buttonPoint.distance(pointer.position);
        if ((pointer.isDown) && (distance < that.buttonsRadius[id])) {
          var button = that.buttons[id];
          button.isDown = true;
          button.frame = 1;
        }
      }
    }

    return reset;
  };

  var moveJoystick = function(point, that) {
    var deltaX = point.x - that.stickPoint.x,
        deltaY = point.y - that.stickPoint.y,
        rotation = that.stickPoint.angle(point);

    if (that.stickPoint.distance(point) > that.stickRadius) {
      deltaX = (deltaX === 0) ? 0 : Math.cos(rotation) * that.stickRadius;
      deltaY = (deltaY === 0) ? 0 : Math.sin(rotation) * that.stickRadius;
    }

    that.stick.properties.x = parseInt((deltaX / that.stickRadius) * 100, 10);
    that.stick.properties.y = parseInt((deltaY / that.stickRadius) * 100, 10);

    that.stick.properties.rotation = rotation;
    that.stick.properties.angle = (180 / Math.PI) * rotation;
    that.stick.properties.distance = parseInt((that.stickPoint.distance(point) / that.stickRadius) * 100, 10);

    that.stick.properties.up = ((rotation > UP_LOWER_BOUND) && (rotation <= UP_UPPER_BOUND));
    that.stick.properties.down = ((rotation > DOWN_LOWER_BOUND) && (rotation <= DOWN_UPPER_BOUND));
    that.stick.properties.right = ((rotation > RIGHT_LOWER_BOUND) && (rotation <= RIGHT_UPPER_BOUND));
    that.stick.properties.left = ((rotation > LEFT_LOWER_BOUND) || (rotation <= LEFT_UPPER_BOUND));

    if ((that.stick.properties.x === 0) && (that.stick.properties.y === 0)) {
      that.stick.properties.right = false;
      that.stick.properties.left = false;
    }

    that.stick.hDirection = !that.stick.properties.left ? !that.stick.properties.right ? null : Phaser.RIGHT : Phaser.LEFT;
    that.stick.vDirection = !that.stick.properties.up ? !that.stick.properties.down ? null : Phaser.DOWN : Phaser.UP;

    that.stickPad.cameraOffset.x = that.stickPoint.x + deltaX;
    that.stickPad.cameraOffset.y = that.stickPoint.y + deltaY;
  };
} (Phaser));
