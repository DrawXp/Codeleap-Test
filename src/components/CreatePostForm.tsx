import { useState, useRef } from 'react';
import { MdImage, MdClose, MdPsychology } from 'react-icons/md';
import { createClient } from '@supabase/supabase-js';
import { api } from '../services/api';
import { notifySuccess } from '../utils/toast';
import { Modal } from './Modal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CreatePostFormProps {
  username: string;
  onPostCreated: (imageId?: number, imagePreview?: string) => void;
}

export function CreatePostForm({ username, onPostCreated }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await api.post('/', {
        username,
        title,
        content,
      });

      if (mediaPreview && response.data?.id) {
        onPostCreated(response.data.id, mediaPreview);
      } else {
        onPostCreated();
      }

      setTitle('');
      setContent('');
      removeMedia();
      notifySuccess('CodeLeap is fire! 🔥');
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAiSuggestion = async () => {
    if (!aiTheme.trim()) return;
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: { theme: aiTheme }
      });

      if (error) throw error;

      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setTitle(result.title.substring(0, 40));
      setContent(result.content.substring(0, 350));
      setIsAiModalOpen(false);
      setAiTheme('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleCreate} className="p-4 sm:p-6">
        <h2 className="text-[1.375rem] font-extrabold mb-6 text-center text-balance mx-auto max-w-lg bg-gradient-to-r from-white to-[var(--color-primary)] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(12,242,244,0.4)] tracking-wide">
          Open your mind, let reality rewind, and leave your vibe in the comments below.
        </h2>

        <div className="flex flex-col mb-4">
          <label htmlFor="title" className="text-[1rem] mb-2 text-gray-300">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Open you mind"
            className="glass-input"
          />
        </div>

        <div className="flex flex-col mb-6">
          <label htmlFor="content" className="text-[1rem] mb-2 text-gray-300">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Pour your heart out here"
            rows={3}
            className="glass-input resize-none"
          />
        </div>

        <div className="flex flex-col gap-4">
          {mediaPreview && (
            <div className="relative w-max mt-2">
              <img src={mediaPreview} alt="Preview" className="h-32 rounded-lg object-cover border border-white/20" />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 bg-[#FF5151] text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
              >
                <MdClose size={16} />
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-white hover:brightness-125 transition-all"
            >
              <MdImage size={24} />
              <span className="font-bold">Add Image</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 text-white hover:brightness-125 transition-all mr-auto ml-4"
            >
              <MdPsychology size={24} />
              <span className="font-bold">AI Suggestion</span>
            </button>

            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || isCreating}
              className="btn-primary flex items-center justify-center min-w-[100px]"
            >
              {isCreating ? '...' : 'Create'}
            </button>
          </div>
        </div>
      </form>

      <Modal
        isOpen={isAiModalOpen}
        title="AI Post Generation"
        onClose={() => setIsAiModalOpen(false)}
        onConfirm={handleAiSuggestion}
        confirmText={isAiLoading ? 'Loading...' : 'Generate'}
        disabled={!aiTheme.trim() || isAiLoading}
      >
        <div className="flex flex-col mb-6">
          <label htmlFor="ai-theme" className="text-[1rem] mb-2 text-gray-300">Theme</label>
          <input
            type="text"
            id="ai-theme"
            value={aiTheme}
            onChange={(e) => setAiTheme(e.target.value)}
            placeholder="Ex: Cooking a dinner; Riding a Horse"
            className="glass-input"
            disabled={isAiLoading}
          />
        </div>
      </Modal>
    </>
  );
}