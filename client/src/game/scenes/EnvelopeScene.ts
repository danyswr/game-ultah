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
    this.load.spritesheet('envelope-animation', '/assets/envelope-spritesheet.png', {
      frameWidth: 341,
      frameHeight: 341
    });
    this.load.audio('envelope-open', '/sounds/success.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    // Create animated sprite using the spritesheet
    const envelopeSprite = this.add.sprite(width / 2, height / 2, 'envelope-animation');
    envelopeSprite.setOrigin(0.5, 0.5);
    envelopeSprite.setDisplaySize(400, 400);
    
    // Create animation with 9 frames - INCREASED frameRate for smoother animation
    this.anims.create({
      key: 'envelope-open',
      frames: this.anims.generateFrameNumbers('envelope-animation', { start: 0, end: 8 }),
      frameRate: 18, // Increased from 12 to 18 for smoother animation
      repeat: 0
    });
    
    this.envelopeSprites.push(envelopeSprite);

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

    // Use once to prevent multiple calls
    this.input.once('pointerdown', () => {
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

    const sprite = this.envelopeSprites[0];
    sprite.play('envelope-open');
    
    // Use once to prevent multiple transitions
    sprite.once('animationcomplete', () => {
      // Reduced delay from 1000 to 300ms for faster transition
      this.time.delayedCall(300, () => {
        this.scene.start('LetterScene');
      });
    });
  }
}
