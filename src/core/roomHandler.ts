import { Socket } from 'socket.io-client';

/**
 * 방 관련 핸들링 클래스
 */
export class RoomHandler {
    private socket: Socket;
    private joinedRooms: Set<string> = new Set();

    constructor(socket: Socket) {
        this.socket = socket;
    }

    /**
     * 방 입장
     */
    joinRoom(roomName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket.connected) {
                reject(new Error('Socket is not connected'));
                return;
            }

            if (this.joinedRooms.has(roomName)) {
                resolve();
                return;
            }

            this.socket.emit('join-room', roomName, (response: any) => {
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    this.joinedRooms.add(roomName);
                    resolve();
                }
            });
        });
    }

    /**
     * 방 나가기
     */
    leaveRoom(roomName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket.connected) {
                reject(new Error('Socket is not connected'));
                return;
            }

            if (!this.joinedRooms.has(roomName)) {
                resolve();
                return;
            }

            this.socket.emit('leave-room', roomName, (response: any) => {
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    this.joinedRooms.delete(roomName);
                    resolve();
                }
            });
        });
    }

    /**
     * 현재 참여 중인 방 목록 가져오기
     */
    getJoinedRooms(): string[] {
        return Array.from(this.joinedRooms);
    }

    /**
     * 특정 방에 참여 중인지 확인
     */
    isInRoom(roomName: string): boolean {
        return this.joinedRooms.has(roomName);
    }

    /**
     * 모든 방 나가기
     */
    leaveAllRooms(): Promise<void[]> {
        const rooms = Array.from(this.joinedRooms);
        return Promise.all(rooms.map((room) => this.leaveRoom(room)));
    }

    /**
     * 내부 상태 초기화
     */
    clear(): void {
        this.joinedRooms.clear();
    }
}
