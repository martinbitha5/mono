import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { FORUM_CATEGORIES } from '@ats/types';
import {
  Plus, MessageSquare, Pin, Lock, Eye,
  ChevronLeft, Send, CheckCircle, Trash2, Edit2,
} from 'lucide-react';

type TopicCategory = 'general' | 'technical' | 'help' | 'announcement' | 'off_topic';
type ForumCategoryFilter = TopicCategory | 'all';

type TopicAuthor = { full_name: string; photo_url: string | null; role: string; site: string } | null;
type ReplyAuthor = { full_name: string; photo_url: string | null; role: string } | null;

type TopicRow = {
  id: string; title: string; content: string; author_id: string;
  category: string; is_pinned: boolean; is_locked: boolean;
  views_count: number; replies_count: number;
  last_reply_at: string | null; last_reply_by: string | null;
  created_at: string; updated_at: string;
  author: TopicAuthor;
};

type ReplyRow = {
  id: string; topic_id: string; author_id: string; content: string;
  parent_reply_id: string | null; is_solution: boolean;
  created_at: string; updated_at: string;
  author: ReplyAuthor;
};

const CAT_STYLES: Record<string, string> = {
  general: 'text-zinc-400 bg-zinc-800',
  technical: 'text-blue-400 bg-blue-500/10',
  help: 'text-amber-400 bg-amber-500/10',
  announcement: 'text-purple-400 bg-purple-500/10',
  off_topic: 'text-zinc-500 bg-zinc-800/60',
};

const CAT_LABELS: Record<string, string> = {
  general: 'Général', technical: 'Technique', help: 'Aide',
  announcement: 'Annonce', off_topic: 'Hors-sujet',
};

function AuthorAvatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dims: Record<string, string> = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-[13px]',
    lg: 'w-11 h-11 text-[16px]',
  };
  return (
    <div className={`${dims[size]} rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function hasViewed(profileId: string, topicId: string): boolean {
  try {
    const viewed: string[] = JSON.parse(localStorage.getItem(`fv_${profileId}`) ?? '[]');
    return viewed.includes(topicId);
  } catch { return false; }
}
function markViewed(profileId: string, topicId: string) {
  try {
    const key = `fv_${profileId}`;
    const viewed: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!viewed.includes(topicId)) {
      viewed.push(topicId);
      localStorage.setItem(key, JSON.stringify(viewed.slice(-200)));
    }
  } catch {}
}

function useTopics(category: ForumCategoryFilter) {
  return useQuery({
    queryKey: ['forum-topics', category],
    queryFn: async () => {
      let q = supabase
        .from('forum_topics')
        .select('*, author:profiles!forum_topics_author_id_fkey(full_name, photo_url, role, site)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (category !== 'all') q = q.eq('category', category);
      const { data } = await q;
      return (data ?? []) as unknown as TopicRow[];
    },
    refetchInterval: 15_000,
  });
}

function useReplies(topicId: string | null) {
  return useQuery({
    queryKey: ['forum-replies', topicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('forum_replies')
        .select('*, author:profiles!author_id(full_name, photo_url, role)')
        .eq('topic_id', topicId!)
        .order('created_at', { ascending: true });
      return (data ?? []) as unknown as ReplyRow[];
    },
    enabled: !!topicId,
    refetchInterval: 10_000,
  });
}

export function ForumPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<ForumCategoryFilter>('all');
  const [selectedTopic, setSelectedTopic] = useState<TopicRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<TopicRow | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyRow | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';
  const { data: topics, isLoading } = useTopics(category);
  const { data: replies } = useReplies(selectedTopic?.id ?? null);

  const [topicForm, setTopicForm] = useState<{ title: string; content: string; category: TopicCategory }>({ title: '', content: '', category: 'general' });

  // ── Open topic ────────────────────────────────────────────────────────────
  const openTopic = async (topic: TopicRow) => {
    setSelectedTopic(topic);
    if (user && !hasViewed(user.id, topic.id)) {
      markViewed(user.id, topic.id);
      await supabase
        .from('forum_topics')
        .update({ views_count: (topic.views_count ?? 0) + 1 })
        .eq('id', topic.id);
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createTopic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('forum_topics').insert({
        title: topicForm.title,
        content: topicForm.content,
        category: topicForm.category,
        author_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      setCreateOpen(false);
      setTopicForm({ title: '', content: '', category: 'general' });
    },
  });

  const updateTopic = useMutation({
    mutationFn: async () => {
      if (!editTopic) return;
      const { error } = await supabase
        .from('forum_topics')
        .update({ title: topicForm.title, content: topicForm.content, category: topicForm.category })
        .eq('id', editTopic.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      if (selectedTopic?.id === editTopic?.id) {
        setSelectedTopic((prev) => prev ? { ...prev, ...topicForm } : null);
      }
      setEditTopic(null);
    },
  });

  const deleteTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase.from('forum_topics').delete().eq('id', topicId);
      if (error) throw error;
    },
    onSuccess: (_, topicId) => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      if (selectedTopic?.id === topicId) setSelectedTopic(null);
    },
  });

  const pinTopic = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      await supabase.from('forum_topics').update({ is_pinned: !pinned }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      setSelectedTopic((prev) => prev ? { ...prev, is_pinned: !prev.is_pinned } : null);
    },
  });

  const lockTopic = useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      await supabase.from('forum_topics').update({ is_locked: !locked }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      setSelectedTopic((prev) => prev ? { ...prev, is_locked: !prev.is_locked } : null);
    },
  });

  const createReply = useMutation({
    mutationFn: async () => {
      if (!selectedTopic || !user || !replyContent.trim()) return;
      const { error } = await supabase.from('forum_replies').insert({
        topic_id: selectedTopic.id,
        author_id: user.id,
        content: replyContent.trim(),
        parent_reply_id: replyingTo?.id ?? null,
      });
      if (error) throw error;
      await supabase.from('forum_topics').update({
        replies_count: (selectedTopic.replies_count ?? 0) + 1,
        last_reply_at: new Date().toISOString(),
        last_reply_by: user.id,
      }).eq('id', selectedTopic.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedTopic?.id] });
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
      setReplyContent('');
      setReplyingTo(null);
    },
  });

  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase.from('forum_replies').delete().eq('id', replyId);
      if (error) throw error;
      if (selectedTopic) {
        await supabase.from('forum_topics').update({
          replies_count: Math.max(0, (selectedTopic.replies_count ?? 1) - 1),
        }).eq('id', selectedTopic.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedTopic?.id] });
      queryClient.invalidateQueries({ queryKey: ['forum-topics'] });
    },
  });

  const markSolution = useMutation({
    mutationFn: async (replyId: string) => {
      await supabase.from('forum_replies').update({ is_solution: true }).eq('id', replyId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedTopic?.id] }),
  });

  // ── TOPIC DETAIL VIEW ─────────────────────────────────────────────────────
  if (selectedTopic) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTopic(null)}
            className="flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Forum
          </button>
          <span className="text-zinc-700 text-[12px]">/</span>
          <span className="text-[13px] text-zinc-400 truncate max-w-xs">{selectedTopic.title}</span>
        </div>

        {/* Topic card */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] bg-white/[0.01]">
            <div className="flex items-start gap-3">
              <AuthorAvatar
                name={selectedTopic.author?.full_name ?? '?'}
                photoUrl={selectedTopic.author?.photo_url}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[13px] font-semibold text-zinc-200">
                    {selectedTopic.author?.full_name ?? '—'}
                  </span>
                  {selectedTopic.author?.site && (
                    <span className="text-[11px] text-zinc-600">{selectedTopic.author.site}</span>
                  )}
                  <span className="text-[11px] text-zinc-700">· {formatDate(selectedTopic.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={['text-[11px] px-2 py-0.5 rounded-md font-medium', CAT_STYLES[selectedTopic.category] ?? ''].join(' ')}>
                    {CAT_LABELS[selectedTopic.category] ?? selectedTopic.category}
                  </span>
                  {selectedTopic.is_pinned && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-400">
                      <Pin className="w-3 h-3" /> Épinglé
                    </span>
                  )}
                  {selectedTopic.is_locked && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400">
                      <Lock className="w-3 h-3" /> Verrouillé
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-5">
            <h2 className="text-[17px] font-bold text-zinc-100 mb-3">{selectedTopic.title}</h2>
            <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedTopic.content}</p>
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.04] text-[12px] text-zinc-600">
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {selectedTopic.views_count} vues</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {selectedTopic.replies_count} réponses</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!selectedTopic.is_locked && (
            <Button size="sm" onClick={() => { setReplyingTo(null); replyRef.current?.focus(); }}>
              <Send className="w-3.5 h-3.5" />
              Répondre
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm"
                onClick={() => pinTopic.mutate({ id: selectedTopic.id, pinned: selectedTopic.is_pinned })}
                loading={pinTopic.isPending}
              >
                <Pin className="w-3.5 h-3.5" />
                {selectedTopic.is_pinned ? 'Désépingler' : 'Épingler'}
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => lockTopic.mutate({ id: selectedTopic.id, locked: selectedTopic.is_locked })}
                loading={lockTopic.isPending}
              >
                <Lock className="w-3.5 h-3.5" />
                {selectedTopic.is_locked ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
            </>
          )}
          {(selectedTopic.author_id === user?.id || isAdmin) && (
            <>
              <Button variant="ghost" size="sm"
                onClick={() => {
                  setEditTopic(selectedTopic);
                  setTopicForm({ title: selectedTopic.title, content: selectedTopic.content, category: selectedTopic.category as TopicCategory });
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Modifier
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => { if (confirm('Supprimer ce sujet et toutes ses réponses ?')) deleteTopic.mutate(selectedTopic.id); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </Button>
            </>
          )}
        </div>

        {/* Replies + form */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.01] flex items-center gap-2">
            <span className="text-[13px] font-semibold text-zinc-200">Réponses</span>
            {replies && replies.length > 0 && (
              <span className="text-[11px] font-bold bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded-md">{replies.length}</span>
            )}
          </div>

          {!replies || replies.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="w-7 h-7 text-zinc-700 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-500">Aucune réponse — soyez le premier !</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={['px-5 py-4', reply.is_solution ? 'bg-emerald-500/[0.03] border-l-2 border-emerald-500/30' : ''].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <AuthorAvatar name={reply.author?.full_name ?? '?'} photoUrl={reply.author?.photo_url} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[13px] font-semibold text-zinc-200">{reply.author?.full_name ?? '—'}</span>
                        <span className="text-[11px] text-zinc-700">{formatDate(reply.created_at)}</span>
                        {reply.is_solution && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle className="w-3 h-3" /> Solution
                          </span>
                        )}
                      </div>
                      {reply.parent_reply_id && (
                        <div className="text-[12px] text-zinc-600 bg-white/[0.03] border-l-2 border-zinc-700 pl-2 mb-2 rounded-r py-1">
                          En réponse à un message précédent
                        </div>
                      )}
                      <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                      <div className="flex items-center gap-3 mt-2.5 text-[11px]">
                        {!selectedTopic.is_locked && (
                          <button
                            onClick={() => { setReplyingTo(reply); setReplyContent(''); replyRef.current?.focus(); }}
                            className="text-zinc-600 hover:text-blue-400 transition-colors"
                          >
                            Répondre
                          </button>
                        )}
                        {selectedTopic.author_id === user?.id && !reply.is_solution && (
                          <button
                            onClick={() => markSolution.mutate(reply.id)}
                            className="text-zinc-600 hover:text-emerald-400 transition-colors"
                          >
                            Marquer solution
                          </button>
                        )}
                        {(reply.author_id === user?.id || isAdmin) && (
                          <button
                            onClick={() => { if (confirm('Supprimer cette réponse ?')) deleteReply.mutate(reply.id); }}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply input */}
          {!selectedTopic.is_locked && (
            <div className="px-5 py-4 border-t border-white/[0.05] bg-white/[0.01]">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 text-[12px] text-zinc-500 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.04]">
                  <span>
                    En réponse à <span className="text-zinc-300 font-medium">{replyingTo.author?.full_name}</span>
                  </span>
                  <button onClick={() => setReplyingTo(null)} className="ml-auto text-[11px] text-zinc-600 hover:text-zinc-400">
                    Annuler
                  </button>
                </div>
              )}
              <div className="flex gap-3 items-end">
                <textarea
                  ref={replyRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Votre réponse... (Ctrl+Entrée pour envoyer)"
                  rows={3}
                  className="input-base resize-none flex-1 text-[13px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && replyContent.trim()) {
                      createReply.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => createReply.mutate()}
                  loading={createReply.isPending}
                  disabled={!replyContent.trim()}
                  size="sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Envoyer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Edit topic modal */}
        <Modal
          open={!!editTopic}
          onClose={() => setEditTopic(null)}
          title="Modifier le sujet"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="label-base">Titre</label>
              <input
                type="text"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">Catégorie</label>
              <select
                value={topicForm.category}
                onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value as TopicCategory })}
                className="select-base"
              >
                {FORUM_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Contenu</label>
              <textarea
                value={topicForm.content}
                onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
                rows={8}
                className="input-base resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditTopic(null)}>Annuler</Button>
              <Button
                onClick={() => updateTopic.mutate()}
                loading={updateTopic.isPending}
                disabled={!topicForm.title || !topicForm.content}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── TOPIC LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-zinc-50 tracking-tight">Forum</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Discussion entre agents</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Nouveau sujet
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setCategory('all')}
          className={['px-3 py-1.5 rounded-md text-[12px] font-medium transition-all', category === 'all' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'].join(' ')}
        >
          Tous
        </button>
        {FORUM_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value as ForumCategoryFilter)}
            className={['px-3 py-1.5 rounded-md text-[12px] font-medium transition-all', category === cat.value ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Topic table */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-[36px_1fr_100px_80px_60px_48px] gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015]">
          <span />
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Sujet</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Auteur</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Catégorie</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em] flex items-center">
            <Eye className="w-3 h-3" />
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em] flex items-center">
            <MessageSquare className="w-3 h-3" />
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="w-20 h-4 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : topics?.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucun sujet dans cette catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {topics?.map((topic) => (
              <div
                key={topic.id}
                onClick={() => openTopic(topic)}
                className={[
                  'flex sm:grid sm:grid-cols-[36px_1fr_100px_80px_60px_48px] items-center gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer',
                  topic.is_pinned ? 'border-l-2 border-blue-500/40' : '',
                ].join(' ')}
              >
                <AuthorAvatar name={topic.author?.full_name ?? '?'} photoUrl={topic.author?.photo_url} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {topic.is_pinned && <Pin className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                    {topic.is_locked && <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
                    <p className="text-[13px] font-medium text-zinc-200 truncate">{topic.title}</p>
                  </div>
                  <p className="text-[12px] text-zinc-600 truncate hidden sm:block">
                    {topic.author?.site && `${topic.author.site} · `}{formatDate(topic.created_at)}
                  </p>
                </div>

                <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{topic.author?.full_name ?? '—'}</span>

                <span className="hidden sm:block">
                  <span className={['text-[11px] px-2 py-0.5 rounded-md font-medium', CAT_STYLES[topic.category] ?? ''].join(' ')}>
                    {CAT_LABELS[topic.category] ?? topic.category}
                  </span>
                </span>

                <span className="hidden sm:block text-[12px] text-zinc-600 tabular-nums">{topic.views_count}</span>
                <span className="hidden sm:block text-[12px] text-zinc-600 tabular-nums">{topic.replies_count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create topic modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setTopicForm({ title: '', content: '', category: 'general' }); }}
        title="Nouveau sujet"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Titre</label>
            <input
              type="text"
              value={topicForm.title}
              onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              className="input-base"
              placeholder="Titre de votre sujet"
            />
          </div>
          <div>
            <label className="label-base">Catégorie</label>
            <select
              value={topicForm.category}
              onChange={(e) => setTopicForm({ ...topicForm, category: e.target.value as TopicCategory })}
              className="select-base"
            >
              {FORUM_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Contenu</label>
            <textarea
              value={topicForm.content}
              onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })}
              rows={7}
              className="input-base resize-none"
              placeholder="Décrivez votre sujet en détail..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createTopic.mutate()}
              loading={createTopic.isPending}
              disabled={!topicForm.title || !topicForm.content}
            >
              Publier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
