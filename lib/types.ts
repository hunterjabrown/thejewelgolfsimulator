export type Session = {
  id: string;
  name: string;
  startsAt: number;
  endsAt: number;
  players: number;
  openToJoin: boolean;
  createdAt: number;
};

export type CreateSessionInput = {
  name: string;
  startsAt: number;
  endsAt: number;
  players: number;
  openToJoin: boolean;
};
