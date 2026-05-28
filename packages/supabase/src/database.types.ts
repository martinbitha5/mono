// Auto-generated shape — run `pnpm --filter @ats/supabase gen:types` to refresh from Supabase CLI

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          photo_url: string | null
          role: 'admin' | 'supervisor' | 'it_agent' | 'tech_agent'
          site: string
          fonction: string
          start_date: string
          status: 'active' | 'inactive'
          service: 'tech' | 'it' | 'both'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string
          photo_url?: string | null
          role?: 'admin' | 'supervisor' | 'it_agent' | 'tech_agent'
          site?: string
          fonction?: string
          start_date?: string
          status?: 'active' | 'inactive'
          service?: 'tech' | 'it' | 'both'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          photo_url?: string | null
          role?: 'admin' | 'supervisor' | 'it_agent' | 'tech_agent'
          site?: string
          fonction?: string
          start_date?: string
          status?: 'active' | 'inactive'
          service?: 'tech' | 'it' | 'both'
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          site: string
          check_in_time: string
          status: 'present' | 'late' | 'absent'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site: string
          check_in_time?: string
          status: 'present' | 'late' | 'absent'
          notes?: string | null
          created_at?: string
        }
        Update: {
          status?: 'present' | 'late' | 'absent'
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      installations: {
        Row: {
          id: string
          user_id: string
          site: string
          airline: string
          network_ok: boolean
          machines_ok: boolean
          software_ok: boolean
          status: 'validated' | 'not_validated' | 'issue_detected'
          comment: string | null
          validated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site: string
          airline: string
          network_ok?: boolean
          machines_ok?: boolean
          software_ok?: boolean
          status?: 'validated' | 'not_validated' | 'issue_detected'
          comment?: string | null
          validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          airline?: string
          network_ok?: boolean
          machines_ok?: boolean
          software_ok?: boolean
          status?: 'validated' | 'not_validated' | 'issue_detected'
          comment?: string | null
          validated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'installations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          site: string
          priority: 'low' | 'medium' | 'critical'
          status: 'open' | 'in_progress' | 'resolved'
          reported_by: string
          assigned_to: string | null
          photo_url: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          site: string
          priority: 'low' | 'medium' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved'
          reported_by: string
          assigned_to?: string | null
          photo_url?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved'
          assigned_to?: string | null
          photo_url?: string | null
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'incidents_reported_by_fkey'
            columns: ['reported_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'incidents_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          site: string
          start_time: string
          end_time: string
          shift_type: 'day' | 'night'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site: string
          start_time: string
          end_time: string
          shift_type: 'day' | 'night'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          start_time?: string
          end_time?: string
          shift_type?: 'day' | 'night'
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedules_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      equipment: {
        Row: {
          id: string
          name: string
          type: 'communication' | 'IT' | 'network' | 'other'
          serial_number: string | null
          site: string
          status: 'functional' | 'faulty' | 'out_of_service'
          availability: 'available' | 'assigned'
          assigned_to: string | null
          notes: string | null
          marque: string | null
          designation: string | null
          description: string | null
          adresse_mac: string | null
          affectation: string | null
          proprietaire: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'communication' | 'IT' | 'network' | 'other'
          serial_number?: string | null
          site: string
          status?: 'functional' | 'faulty' | 'out_of_service'
          availability?: 'available' | 'assigned'
          assigned_to?: string | null
          notes?: string | null
          marque?: string | null
          designation?: string | null
          description?: string | null
          adresse_mac?: string | null
          affectation?: string | null
          proprietaire?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'communication' | 'IT' | 'network' | 'other'
          serial_number?: string | null
          status?: 'functional' | 'faulty' | 'out_of_service'
          availability?: 'available' | 'assigned'
          assigned_to?: string | null
          notes?: string | null
          marque?: string | null
          designation?: string | null
          description?: string | null
          adresse_mac?: string | null
          affectation?: string | null
          proprietaire?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'equipment_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      equipment_logs: {
        Row: {
          id: string
          equipment_id: string
          user_id: string | null
          action: 'assigned' | 'returned' | 'faulty' | 'repaired' | 'created'
          notes: string | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          user_id?: string | null
          action: 'assigned' | 'returned' | 'faulty' | 'repaired' | 'created'
          notes?: string | null
          performed_by?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'equipment_logs_equipment_id_fkey'
            columns: ['equipment_id']
            isOneToOne: false
            referencedRelation: 'equipment'
            referencedColumns: ['id']
          }
        ]
      }
      gse_equipment: {
        Row: {
          id: string
          name: string
          serie: string
          marque: string
          type: 'tractor' | 'escalier' | 'gpu' | 'pushback' | 'belt_loader' | 'ambulift' | 'loader' | 'air_starter' | 'toilette' | 'potable_water' | 'tarmac_bus' | 'other'
          site: string
          horametre_actuel: number
          horametre_revision: number
          intervalle: number
          horametre_prochain: number
          delta: number
          statut: 'op' | 'inop'
          assigned_to: string | null
          obs: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          serie?: string
          marque?: string
          type?: 'tractor' | 'escalier' | 'gpu' | 'pushback' | 'belt_loader' | 'ambulift' | 'loader' | 'air_starter' | 'toilette' | 'potable_water' | 'tarmac_bus' | 'other'
          site?: string
          horametre_actuel: number
          horametre_revision?: number
          intervalle?: number
          statut?: 'op' | 'inop'
          assigned_to?: string | null
          obs?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          serie?: string
          marque?: string
          type?: 'tractor' | 'escalier' | 'gpu' | 'pushback' | 'belt_loader' | 'ambulift' | 'loader' | 'air_starter' | 'toilette' | 'potable_water' | 'tarmac_bus' | 'other'
          site?: string
          horametre_actuel?: number
          horametre_revision?: number
          intervalle?: number
          statut?: 'op' | 'inop'
          assigned_to?: string | null
          obs?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_checklists: {
        Row: {
          id: string
          equipment_id: string
          agent_id: string
          site: string
          proprete: 'C' | 'NC'
          carburant: 'C' | 'NC'
          huile_moteur: 'C' | 'NC'
          freins: 'C' | 'NC'
          pneus: 'C' | 'NC'
          gyrophare: 'C' | 'NC'
          cales: 'C' | 'NC'
          phare_clignotant: 'C' | 'NC'
          extincteur: 'C' | 'NC'
          hydraulique: 'C' | 'NC'
          horametre: number
          observation: string
          final_status: 'op' | 'inop'
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          agent_id: string
          site?: string
          proprete?: 'C' | 'NC'
          carburant?: 'C' | 'NC'
          huile_moteur?: 'C' | 'NC'
          freins?: 'C' | 'NC'
          pneus?: 'C' | 'NC'
          gyrophare?: 'C' | 'NC'
          cales?: 'C' | 'NC'
          phare_clignotant?: 'C' | 'NC'
          extincteur?: 'C' | 'NC'
          hydraulique?: 'C' | 'NC'
          horametre?: number
          observation?: string
          final_status?: 'op' | 'inop'
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'daily_checklists_equipment_id_fkey'
            columns: ['equipment_id']
            isOneToOne: false
            referencedRelation: 'gse_equipment'
            referencedColumns: ['id']
          }
        ]
      }
      gse_incidents: {
        Row: {
          id: string
          title: string
          description: string
          equipment_id: string | null
          priority: 'faible' | 'moyen' | 'critique'
          status: 'ouvert' | 'en_cours' | 'resolu'
          site: string
          reporter_id: string
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          equipment_id?: string | null
          priority?: 'faible' | 'moyen' | 'critique'
          status?: 'ouvert' | 'en_cours' | 'resolu'
          site: string
          reporter_id: string
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          equipment_id?: string | null
          priority?: 'faible' | 'moyen' | 'critique'
          status?: 'ouvert' | 'en_cours' | 'resolu'
          assigned_to?: string | null
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          id: string
          equipment_id: string
          fuel_type: 'gasoil' | 'essence' | 'huile'
          quantity: number
          horametre_at_fill: number
          site: string
          agent_id: string | null
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          fuel_type?: 'gasoil' | 'essence' | 'huile'
          quantity: number
          horametre_at_fill?: number
          site?: string
          agent_id?: string | null
          notes?: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      fuel_stock: {
        Row: {
          id: string
          site: string
          fuel_type: 'gasoil' | 'essence' | 'huile'
          quantity: number
          threshold: number
          updated_at: string
        }
        Insert: {
          id?: string
          site?: string
          fuel_type: 'gasoil' | 'essence' | 'huile'
          quantity?: number
          threshold?: number
          updated_at?: string
        }
        Update: {
          quantity?: number
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      fuel_appro_logs: {
        Row: {
          id: string
          site: string
          fuel_type: 'gasoil' | 'essence' | 'huile'
          quantity: number
          notes: string
          agent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site?: string
          fuel_type: 'gasoil' | 'essence' | 'huile'
          quantity: number
          notes?: string
          agent_id?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'fuel_appro_logs_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      forum_topics: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          category: 'general' | 'technical' | 'help' | 'announcement' | 'off_topic'
          is_pinned: boolean
          is_locked: boolean
          views_count: number
          replies_count: number
          last_reply_at: string | null
          last_reply_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          category?: 'general' | 'technical' | 'help' | 'announcement' | 'off_topic'
          is_pinned?: boolean
          is_locked?: boolean
          views_count?: number
          replies_count?: number
          last_reply_at?: string | null
          last_reply_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          content?: string
          category?: 'general' | 'technical' | 'help' | 'announcement' | 'off_topic'
          is_pinned?: boolean
          is_locked?: boolean
          views_count?: number
          replies_count?: number
          last_reply_at?: string | null
          last_reply_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'forum_topics_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      forum_replies: {
        Row: {
          id: string
          topic_id: string
          author_id: string
          content: string
          parent_reply_id: string | null
          is_solution: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          author_id: string
          content: string
          parent_reply_id?: string | null
          is_solution?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          is_solution?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'forum_replies_topic_id_fkey'
            columns: ['topic_id']
            isOneToOne: false
            referencedRelation: 'forum_topics'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          service: 'tech' | 'it' | 'both'
          type: 'intervention' | 'gse_inop' | 'incident' | 'maintenance' | 'info'
          title: string
          body: string
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service: 'tech' | 'it' | 'both'
          type: 'intervention' | 'gse_inop' | 'incident' | 'maintenance' | 'info'
          title: string
          body: string
          link?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          link?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          notification_id: string
          user_id: string
          read_at?: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'notification_reads_notification_id_fkey'
            columns: ['notification_id']
            isOneToOne: false
            referencedRelation: 'notifications'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
