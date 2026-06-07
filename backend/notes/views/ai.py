from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from notes.models import Note
from notes.ai_service import ai_service
from app.services.credits import InsufficientCredits, charge, has_credits


def _no_credits_response(action):
    return Response(
        {'error': 'No credits remaining. Please purchase more to use AI features.'},
        status=status.HTTP_402_PAYMENT_REQUIRED)


class GenerateNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt')
        note_id = request.data.get('note_id')

        if not prompt:
            return Response({'error': 'Prompt is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(prompt) > 2000:
            return Response(
                {'error': 'Prompt must be less than 2000 characters'},
                status=status.HTTP_400_BAD_REQUEST)

        if not has_credits(request.user, 'notes.ai_generate'):
            return _no_credits_response('notes.ai_generate')

        try:
            note_context = None
            if note_id:
                note = get_object_or_404(Note, id=note_id, user=request.user)
                note_context = note.content

                if note_context and len(note_context) > 500000:
                    return Response(
                        {
                            'error':
                            'Note content is too large for AI processing. Please use a shorter note.'
                        },
                        status=status.HTTP_400_BAD_REQUEST)

            generated_content = ai_service.generate_note(prompt, note_context)
            charge(request.user, 'notes.ai_generate')
            response_data = {'content': generated_content, 'prompt': prompt}
            if note_id:
                response_data['note_id'] = note_id

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'AI generation failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SummarizeNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, note_id):
        note = get_object_or_404(Note, id=note_id, user=request.user)

        if not note.content:
            return Response({'error': 'Note has no content to summarize'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not has_credits(request.user, 'notes.ai_summarize'):
            return _no_credits_response('notes.ai_summarize')

        try:
            summary = ai_service.summarize_note(note.content)
            charge(request.user, 'notes.ai_summarize')
            return Response({
                'summary': summary,
                'note_id': note_id
            },
                            status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Summarization failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TranslateNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, note_id):
        note = get_object_or_404(Note, id=note_id, user=request.user)
        target_language = request.data.get('target_language')

        if not target_language:
            return Response({'error': 'target_language is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not note.content:
            return Response({'error': 'Note has no content to translate'},
                            status=status.HTTP_400_BAD_REQUEST)

        if not has_credits(request.user, 'notes.ai_translate'):
            return _no_credits_response('notes.ai_translate')

        try:
            translated_content = ai_service.translate_note(
                note.content, target_language)
            charge(request.user, 'notes.ai_translate')
            return Response(
                {
                    'translated_content': translated_content,
                    'target_language': target_language,
                    'note_id': note_id
                },
                status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Translation failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
