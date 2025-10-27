import Phaser from 'phaser';

export default class LetterScene extends Phaser.Scene {
  private letter?: Phaser.GameObjects.Image;
  private tapText?: Phaser.GameObjects.Text;
  private canProceed: boolean = false;
  private slideSound?: Phaser.Sound.BaseSound;
  private clickHandled: boolean = false;

  constructor() {
    super({ key: 'LetterScene' });
  }

  preload() {
    this.load.image('letter', '/assets/letter.png');
    this.load.audio('letter-slide', '/sounds/success.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.clickHandled = false;

    // Background
    const background = this.add.rectangle(0, 0, width, height, 0xf5e6d3);
    background.setOrigin(0, 0);

    // Create letter - start from top (off screen)
    this.letter = this.add.image(width / 2, -300, 'letter');
    
    // Set origin to center
    this.letter.setOrigin(0.5, 0.5);
    
    // Scale the letter to fit nicely on screen
    const maxWidth = width * 0.85;
    const maxHeight = height * 0.85;
    
    const letterScale = Math.min(maxWidth / this.letter.width, maxHeight / this.letter.height);
    this.letter.setScale(letterScale);

    console.log('Letter created at position:', this.letter.x, this.letter.y);
    console.log('Letter scale:', letterScale);
    console.log('Screen size:', width, height);

    // Play sound
    this.slideSound = this.sound.add('letter-slide', { volume: 0.4 });
    this.slideSound.play();

    // Animate letter sliding down to center - FASTER animation (800ms instead of 1500ms)
    this.tweens.add({
      targets: this.letter,
      y: height / 2,
      duration: 800, // Reduced from 1500 to 800 for faster appearance
      ease: 'Cubic.easeOut',
      onComplete: () => {
        console.log('Letter animation complete. Final position:', this.letter?.x, this.letter?.y);
        this.canProceed = true;
        this.showTapText();
      }
    });
  }

  private showTapText() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.tapText = this.add.text(width / 2, height - 80, 'Tap untuk melanjutkan ke permainan', {
      fontSize: '20px',
      color: '#8B4513',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 }
    });
    this.tapText.setOrigin(0.5);

    // Blinking animation
    this.tweens.add({
      targets: this.tapText,
      alpha: 0.5,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // Use once to prevent multiple calls - FIX for the 2x loop issue
    this.input.once('pointerdown', () => {
      if (this.canProceed && !this.clickHandled) {
        this.clickHandled = true;
        this.canProceed = false;
        console.log('Proceeding to RPG Scene');
        
        // Hide text immediately
        if (this.tapText) {
          this.tapText.setVisible(false);
        }
        
        // Quick transition to RPG Scene
        this.time.delayedCall(100, () => {
          this.scene.start('RPGScene');
        });
      }
    });
  }
}
