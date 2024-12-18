// src/types/ExtendedUser.ts
import { User } from 'firebase/auth';
import React from 'react';

export interface ExtendedUser extends User {
  profileImage?: string;
}
