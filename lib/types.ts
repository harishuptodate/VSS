export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
      };
    };
  };
}
// lib/types.ts
// export type Database = any; // Optional: replace with Supabase typed schema if you generated one
