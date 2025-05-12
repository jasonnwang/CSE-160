// Camera class definition
class Camera {
    constructor(canvas) {
        this.fov = 60;
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.lastMouseX = null;
        this.sensitivity = 0.2;
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(
            this.fov, canvas.width / canvas.height, 0.1, 1000
        );
    }

    onMouseMove(event) {
        /*if (this.lastMouseX === null || this.lastMouseY == null) {
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            return;
        }
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;*/

        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const alpha = -deltaX * this.sensitivity;
        this.panLeft(alpha);
    }

    moveForward(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        f.normalize();
        f.mul(speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateViewMatrix();
    }

    moveBackward(speed) {
        let b = new Vector3(this.eye.elements);
        b.sub(this.at);
        b.normalize();
        b.mul(speed);
        this.eye.add(b);
        this.at.add(b);
        this.updateViewMatrix();
    }

    moveLeft(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    moveRight(speed) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    panLeft(alpha) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3([this.eye.elements[0] + f_prime.elements[0], this.eye.elements[1] + f_prime.elements[1], this.eye.elements[2] + f_prime.elements[2]]);
        this.updateViewMatrix();
    }

    panRight(alpha) {
        this.panLeft(-alpha);
    }
}
