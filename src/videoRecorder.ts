import * as JSZip from "jszip";

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: Blob[] = [];

  start() {
    chrome.tabCapture.capture({ video: true }, stream => {
      if (stream == null) return;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm"
      });
      this.mediaRecorder.ondataavailable = e => {
        this.mediaChunks.push(e.data);
      };
      this.mediaRecorder.start();
    });
  }

  stop(zip: JSZip): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.mediaRecorder == null) {
        reject("Recording not started");
        return;
      }
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.mediaChunks, { type: "video/webm" });
        zip.file("screencast.webm", videoBlob);
        resolve();
      };
      this.mediaRecorder.stop();

      this.mediaRecorder = null;
      this.mediaChunks = [];
    });
  }
}
