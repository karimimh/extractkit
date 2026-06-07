import os
import google.generativeai as genai
from django.conf import settings


class AIService:

    def __init__(self):
        self._model = None

    @property
    def model(self):
        if self._model is None:
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(
                model_name='models/gemini-2.5-flash')
        return self._model

    def generate_note(self, prompt: str, note_context: str = None) -> str:
        if note_context:
            full_prompt = f"""You are a helpful AI assistant that answers questions based on the provided note content.

Note Content:
{note_context}

User Question: {prompt}

Provide a clear and concise answer based on the note content above. If the question cannot be answered from the note content, say so and provide general helpful information.

Response:"""
        else:
            full_prompt = f"""Generate note content based on the following prompt. 
Provide well-structured, clear, and informative content suitable for note-taking.

User prompt: {prompt}

Response:"""

        response = self.model.generate_content(full_prompt)
        return response.text

    def summarize_note(self, content: str) -> str:
        full_prompt = f"""Provide a concise summary of the following note content. 
Keep it brief but capture the key points.

Note content:
{content}

Summary:"""

        response = self.model.generate_content(full_prompt)
        return response.text

    def translate_note(self, content: str, target_language: str) -> str:
        full_prompt = f"""Translate the following note content to {target_language}. 
Maintain the structure and formatting.

Note content:
{content}

Translation:"""

        response = self.model.generate_content(full_prompt)
        return response.text


ai_service = AIService()
