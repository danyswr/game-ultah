import Phaser from 'phaser';

export default class EnvelopeScene extends Phaser.Scene {
  private currentFrame: number = 0;
  private envelopeSprites: Phaser.GameObjects.Sprite[] = [];
  private animating: boolean = false;
  private tapText?: Phaser.GameObjects.Text;
  private openSound?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'EnvelopeScene' });
  }

  preload() {
    this.load.image('envelope-spritesheet', '/assets/envelope-spritesheet.png');
    this.load.audio('envelope-open', '/sounds/success.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    const spriteWidth = 683;
    const spriteHeight = 683;
    const totalFrames = 9;
    const cols = 3;

    for (let i = 0; i < totalFrames; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const sprite = this.add.sprite(width / 2, height / 2, 'envelope-spritesheet');
      sprite.setCrop(col * spriteWidth, row * spriteHeight, spriteWidth, spriteHeight);
      sprite.setDisplaySize(400, 400);
      sprite.setVisible(i === 0);
      
      this.envelopeSprites.push(sprite);
    }

    this.tapText = this.add.text(width / 2, height - 100, 'Tap untuk membuka surat', {
      fontSize: '24px',
      color: '#8B4513',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.tapText.setOrigin(0.5);

    this.tweens.add({
      targets: this.tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.openSound = this.sound.add('envelope-open', { volume: 0.5 });

    this.input.on('pointerdown', () => {
      if (!this.animating) {
        this.playAnimation();
      }
    });
  }

  private playAnimation() {
    this.animating = true;
    
    if (this.tapText) {
      this.tapText.setVisible(false);
    }

    this.openSound?.play();

    const animateFrame = (frameIndex: number) => {
      if (frameIndex >= this.envelopeSprites.length) {
        this.time.delayedCall(1000, () => {
          this.scene.start('LetterScene');
        });
        return;
      }

      this.envelopeSprites.forEach((sprite, index) => {
        sprite.setVisible(index === frameIndex);
      });

      this.time.delayedCall(111, () => {
        animateFrame(frameIndex + 1);
      });
    };

    animateFrame(0);
  }
}
