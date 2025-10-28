import Phaser from 'phaser';
import EnvelopeScene from './scenes/EnvelopeScene';
import LetterScene from './scenes/LetterScene';
import RPGScene from './scenes/RPGScene';
import DialogScene from './scenes/DialogScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#f5e6d3',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [EnvelopeScene, LetterScene, RPGScene, DialogScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
