import Phaser from 'phaser';

export default class DialogScene extends Phaser.Scene {
  private dialogBox?: Phaser.GameObjects.Container;
  private parentScene?: Phaser.Scene;
  
  constructor() {
    super({ key: 'DialogScene' });
  }
  
  create(data: { message: string; scene: Phaser.Scene }) {
    this.parentScene = data.scene;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    overlay.setInteractive();
    
    const boxWidth = Math.min(600, width - 40);
    const boxHeight = Math.min(250, height - 100);
    
    const dialogBg = this.add.rectangle(0, 0, boxWidth, boxHeight, 0xFFFFFF, 1);
    dialogBg.setStrokeStyle(4, 0xFF6B9D);
    
    const borderDecoration = this.add.rectangle(0, 0, boxWidth - 10, boxHeight - 10, 0xFFE4E1, 0);
    borderDecoration.setStrokeStyle(2, 0xFFB6C1);
    
    const message = this.add.text(0, -30, data.message, {
      fontSize: '20px',
      color: '#333333',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: boxWidth - 60 }
    });
    message.setOrigin(0.5);
    
    const closeButton = this.add.rectangle(0, boxHeight / 2 - 50, 180, 50, 0xFF6B9D, 1);
    closeButton.setStrokeStyle(3, 0xFFFFFF);
    
    const closeText = this.add.text(0, boxHeight / 2 - 50, 'Tutup', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    closeText.setOrigin(0.5);
    
    this.dialogBox = this.add.container(width / 2, height / 2, [
      dialogBg,
      borderDecoration,
      message,
      closeButton,
      closeText
    ]);
    
    this.dialogBox.setAlpha(0);
    this.dialogBox.setScale(0.8);
    
    this.tweens.add({
      targets: this.dialogBox,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    closeButton.setInteractive({ useHandCursor: true });
    
    closeButton.on('pointerover', () => {
      this.tweens.add({
        targets: [closeButton, closeText],
        scale: 1.1,
        duration: 150
      });
    });
    
    closeButton.on('pointerout', () => {
      this.tweens.add({
        targets: [closeButton, closeText],
        scale: 1,
        duration: 150
      });
    });
    
    closeButton.on('pointerdown', () => {
      this.closeDialog();
    });
    
    overlay.on('pointerdown', () => {
      this.closeDialog();
    });
    
    this.input.keyboard?.once('keydown-ESC', () => {
      this.closeDialog();
    });
    
    this.input.keyboard?.once('keydown-ENTER', () => {
      this.closeDialog();
    });
  }
  
  private closeDialog() {
    this.tweens.add({
      targets: this.dialogBox,
      alpha: 0,
      scale: 0.8,
      duration: 200,
      onComplete: () => {
        if (this.parentScene) {
          this.parentScene.scene.resume();
        }
        this.scene.stop();
      }
    });
  }
}
