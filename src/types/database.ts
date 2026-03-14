export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          emoji: string;
          color: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string;
          color?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          merchant: string;
          description: string;
          amount: number;
          type: "income" | "expense";
          category_id: string;
          payment_method: string;
          source: "manual" | "ocr" | "pdf";
          is_internal_transfer: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          merchant: string;
          description?: string;
          amount: number;
          type: "income" | "expense";
          category_id: string;
          payment_method?: string;
          source?: "manual" | "ocr" | "pdf";
          is_internal_transfer?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          merchant?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense";
          category_id?: string;
          payment_method?: string;
          source?: "manual" | "ocr" | "pdf";
          is_internal_transfer?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience types
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
