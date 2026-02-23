export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      Cuidadores: {
        Row: {
          apellido_Materno: string | null
          apellido_Paterno: string | null
          Custodios: Database["public"]["Enums"]["custodios_enum"] | null
          id: number
          id_Anexo: string
          lada: string | null
          numero: string | null
          pais: string | null
          primer_Nombre: string | null
          segundo_Nombre: string | null
        }
        Insert: {
          apellido_Materno?: string | null
          apellido_Paterno?: string | null
          Custodios?: Database["public"]["Enums"]["custodios_enum"] | null
          id?: number
          id_Anexo: string
          lada?: string | null
          numero?: string | null
          pais?: string | null
          primer_Nombre?: string | null
          segundo_Nombre?: string | null
        }
        Update: {
          apellido_Materno?: string | null
          apellido_Paterno?: string | null
          Custodios?: Database["public"]["Enums"]["custodios_enum"] | null
          id?: number
          id_Anexo?: string
          lada?: string | null
          numero?: string | null
          pais?: string | null
          primer_Nombre?: string | null
          segundo_Nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Cuidadores_id_Anexo_fkey"
            columns: ["id_Anexo"]
            isOneToOne: false
            referencedRelation: "UserAdministrador"
            referencedColumns: ["id_Principal"]
          },
        ]
      }
      Datos: {
        Row: {
          apellido_Materno: string | null
          apellido_Paterno: string | null
          fecha_Nacimiento: string | null
          id: number
          id_Anexo: string
          primer_Nombre: string | null
          segundo_Nombre: string | null
          sexo: Database["public"]["Enums"]["sexo_enum"] | null
        }
        Insert: {
          apellido_Materno?: string | null
          apellido_Paterno?: string | null
          fecha_Nacimiento?: string | null
          id?: number
          id_Anexo: string
          primer_Nombre?: string | null
          segundo_Nombre?: string | null
          sexo?: Database["public"]["Enums"]["sexo_enum"] | null
        }
        Update: {
          apellido_Materno?: string | null
          apellido_Paterno?: string | null
          fecha_Nacimiento?: string | null
          id?: number
          id_Anexo?: string
          primer_Nombre?: string | null
          segundo_Nombre?: string | null
          sexo?: Database["public"]["Enums"]["sexo_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "Datos_id_Anexo_fkey"
            columns: ["id_Anexo"]
            isOneToOne: false
            referencedRelation: "UserAdministrador"
            referencedColumns: ["id_Principal"]
          },
        ]
      }
      Emergencias: {
        Row: {
          id: number
          id_Anexo: string
          lada: string | null
          Nombre: string | null
          numero: string | null
          pais: string | null
        }
        Insert: {
          id?: number
          id_Anexo: string
          lada?: string | null
          Nombre?: string | null
          numero?: string | null
          pais?: string | null
        }
        Update: {
          id?: number
          id_Anexo?: string
          lada?: string | null
          Nombre?: string | null
          numero?: string | null
          pais?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Emergencias_id_Anexo_fkey"
            columns: ["id_Anexo"]
            isOneToOne: false
            referencedRelation: "UserAdministrador"
            referencedColumns: ["id_Principal"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string | null
          id_perfil: string
          id_usuario: string
          nombre_identificador: string | null
        }
        Insert: {
          created_at?: string | null
          id_perfil?: string
          id_usuario: string
          nombre_identificador?: string | null
        }
        Update: {
          created_at?: string | null
          id_perfil?: string
          id_usuario?: string
          nombre_identificador?: string | null
        }
        Relationships: []
      }
      Salud: {
        Row: {
          grupo_distinto: string | null
          grupo_sanguineo:
            | Database["public"]["Enums"]["grupo_sanguineo_enum"]
            | null
          id: number
          id_Anexo: string
          peso: number | null
          talla: number | null
          tipo_RH: Database["public"]["Enums"]["tipo_rh_enum"] | null
        }
        Insert: {
          grupo_distinto?: string | null
          grupo_sanguineo?:
            | Database["public"]["Enums"]["grupo_sanguineo_enum"]
            | null
          id?: number
          id_Anexo: string
          peso?: number | null
          talla?: number | null
          tipo_RH?: Database["public"]["Enums"]["tipo_rh_enum"] | null
        }
        Update: {
          grupo_distinto?: string | null
          grupo_sanguineo?:
            | Database["public"]["Enums"]["grupo_sanguineo_enum"]
            | null
          id?: number
          id_Anexo?: string
          peso?: number | null
          talla?: number | null
          tipo_RH?: Database["public"]["Enums"]["tipo_rh_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "Salud_id_Anexo_fkey"
            columns: ["id_Anexo"]
            isOneToOne: false
            referencedRelation: "UserAdministrador"
            referencedColumns: ["id_Principal"]
          },
        ]
      }
      SaludDetalles: {
        Row: {
          Alergias: boolean | null
          complicaciones: boolean | null
          detalles_Ale: string | null
          detalles_Com: string | null
          id: number
          id_Anexo: string
        }
        Insert: {
          Alergias?: boolean | null
          complicaciones?: boolean | null
          detalles_Ale?: string | null
          detalles_Com?: string | null
          id?: number
          id_Anexo: string
        }
        Update: {
          Alergias?: boolean | null
          complicaciones?: boolean | null
          detalles_Ale?: string | null
          detalles_Com?: string | null
          id?: number
          id_Anexo?: string
        }
        Relationships: [
          {
            foreignKeyName: "SaludDetalles_id_Anexo_fkey"
            columns: ["id_Anexo"]
            isOneToOne: false
            referencedRelation: "UserAdministrador"
            referencedColumns: ["id_Principal"]
          },
        ]
      }
      UserAdministrador: {
        Row: {
          correo: string | null
          id_Principal: string
          password: string | null
          usuario: string | null
        }
        Insert: {
          correo?: string | null
          id_Principal: string
          password?: string | null
          usuario?: string | null
        }
        Update: {
          correo?: string | null
          id_Principal?: string
          password?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      custodios_enum: "Madre" | "Padre" | "Tutor" | "Cuidador"
      grupo_sanguineo_enum: "A" | "B" | "AB" | "O"
      sexo_enum: "Femenino" | "Masculino"
      tipo_rh_enum: "+" | "-"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      custodios_enum: ["Madre", "Padre", "Tutor", "Cuidador"],
      grupo_sanguineo_enum: ["A", "B", "AB", "O"],
      sexo_enum: ["Femenino", "Masculino"],
      tipo_rh_enum: ["+", "-"],
    },
  },
} as const
