import { supabase } from './supabaseClient';

function throwIfError(error) {
  if (error) throw error;
}

export async function listClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      class_date,
      created_at,
      notes(content),
      vocabulary(id),
      homework(id)
    `)
    .order('class_date', { ascending: false });

  throwIfError(error);

  return data.map(cls => ({
    ...cls,
    notes: cls.notes?.content ?? '',
    vocab_count: cls.vocabulary?.length ?? 0,
    homework_count: cls.homework?.length ?? 0,
  }));
}

export async function getClass(id) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      class_date,
      created_at,
      notes(content),
      vocabulary(*),
      homework(*)
    `)
    .eq('id', id)
    .single();

  throwIfError(error);

  return {
    ...data,
    notes: data.notes?.content ?? '',
    vocabulary: data.vocabulary ?? [],
    homework: data.homework ?? [],
  };
}

export async function createClass(classDate) {
  const { data: cls, error } = await supabase
    .from('classes')
    .insert({ class_date: classDate })
    .select()
    .single();

  throwIfError(error);

  const { error: notesError } = await supabase
    .from('notes')
    .insert({ class_id: cls.id, content: '' });

  throwIfError(notesError);
  return cls;
}

export async function updateClassDate(id, classDate) {
  const { data, error } = await supabase
    .from('classes')
    .update({ class_date: classDate })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteClass(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  throwIfError(error);
}

export async function saveNotes(classId, content) {
  const { error } = await supabase
    .from('notes')
    .upsert({ class_id: classId, content, updated_at: new Date().toISOString() }, { onConflict: 'class_id' });

  throwIfError(error);
}

export async function listVocabulary(classId) {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data;
}

export async function listAllVocabulary() {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*, classes!inner(class_date)')
    .order('created_at', { ascending: true });

  throwIfError(error);

  return data
    .map(word => ({ ...word, class_date: word.classes.class_date }))
    .sort((a, b) => b.class_date.localeCompare(a.class_date) || a.created_at.localeCompare(b.created_at));
}

export async function createVocabularyWord(classId, spanishWord, englishTranslation) {
  const { data, error } = await supabase
    .from('vocabulary')
    .insert({
      class_id: classId,
      spanish_word: spanishWord.trim(),
      english_translation: (englishTranslation || '').trim(),
    })
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteVocabularyWord(classId, id) {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('class_id', classId)
    .eq('id', id);

  throwIfError(error);
}

export async function listHomework(classId) {
  const { data, error } = await supabase
    .from('homework')
    .select('*, homework_files(*)')
    .eq('class_id', classId)
    .order('created_at', { ascending: true });

  throwIfError(error);
  return data.map(hw => ({ ...hw, files: hw.homework_files ?? [] }));
}

export async function listAllHomework() {
  const { data, error } = await supabase
    .from('homework')
    .select('*, classes!inner(class_date), homework_files(*)')
    .order('created_at', { ascending: true });

  throwIfError(error);

  return data
    .map(hw => ({
      ...hw,
      class_date: hw.classes.class_date,
      files: hw.homework_files ?? [],
    }))
    .sort((a, b) => b.class_date.localeCompare(a.class_date) || a.created_at.localeCompare(b.created_at));
}

export async function createHomework(classId, title, description) {
  const { data, error } = await supabase
    .from('homework')
    .insert({ class_id: classId, title: title || '', description: description || '' })
    .select()
    .single();

  throwIfError(error);
  return { ...data, files: [] };
}

export async function updateHomework(id, title, description) {
  const { data, error } = await supabase
    .from('homework')
    .update({ title: title ?? '', description: description ?? '' })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteHomework(id) {
  const { error } = await supabase.from('homework').delete().eq('id', id);
  throwIfError(error);
}

export async function listQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_words(id)')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data.map(quiz => ({ ...quiz, word_count: quiz.quiz_words?.length ?? 0 }));
}

export async function getQuiz(id) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_words(*)')
    .eq('id', id)
    .single();

  throwIfError(error);
  return { ...data, words: data.quiz_words ?? [] };
}

export async function createQuiz(name, words) {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ name: name || 'Untitled Quiz' })
    .select()
    .single();

  throwIfError(error);

  if (words.length > 0) {
    const { error: wordsError } = await supabase.from('quiz_words').insert(
      words.map(word => ({
        quiz_id: quiz.id,
        spanish_word: word.spanish_word,
        english_translation: word.english_translation || '',
      }))
    );
    throwIfError(wordsError);
  }

  return getQuiz(quiz.id);
}

export async function updateQuiz(id, updates) {
  const { data, error } = await supabase
    .from('quizzes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteQuiz(id) {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  throwIfError(error);
}

export async function addQuizWord(quizId, word) {
  const { data, error } = await supabase
    .from('quiz_words')
    .insert({
      quiz_id: quizId,
      spanish_word: word.spanish_word,
      english_translation: word.english_translation || '',
    })
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteQuizWord(quizId, wordId) {
  const { error } = await supabase
    .from('quiz_words')
    .delete()
    .eq('quiz_id', quizId)
    .eq('id', wordId);

  throwIfError(error);
}

export async function translateWord(word, source, target) {
  const { data, error } = await supabase.functions.invoke('translate', {
    body: { word, source, target },
  });

  throwIfError(error);
  return data?.translation ?? '';
}
