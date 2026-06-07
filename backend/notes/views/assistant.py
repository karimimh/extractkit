"""
AI Assistant view for handling chat-based interactions with notes
"""
import json
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from notes.models import Note, Label, UserStorageStats
from notes.ai_service import ai_service
from app.services.credits import charge, has_credits


class AIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def get_user_stats(self, user):
        notes = Note.objects.filter(user=user)
        total_notes = notes.count()
        pinned_notes = notes.filter(is_pinned=True).count()
        labels = Label.objects.filter(user=user)
        label_count = labels.count()
        storage_stats = UserStorageStats.objects.filter(user=user).first()
        storage_used_mb = storage_stats.storage_used_mb if storage_stats else 0
        return {
            'total_notes': total_notes,
            'pinned_notes': pinned_notes,
            'label_count': label_count,
            'storage_used_mb': round(storage_used_mb, 2)
        }

    def get_notes_context(self, user, limit=20):
        notes = Note.objects.filter(user=user).order_by('-updated_at')[:limit]
        notes_summary = []
        for note in notes:
            labels = list(note.labels.values_list('name', flat=True))
            notes_summary.append({
                'id':
                note.id,
                'title':
                note.title or 'Untitled',
                'content_preview':
                note.content[:200] +
                '...' if len(note.content) > 200 else note.content,
                'is_pinned':
                note.is_pinned,
                'labels':
                labels,
                'created_at':
                note.created_at.isoformat(),
                'updated_at':
                note.updated_at.isoformat()
            })
        return notes_summary

    def parse_action_from_response(self, response_text):
        actions = []
        if '[[ACTION:' in response_text:
            action_pattern = r'\[\[ACTION:(\w+)\(([^)]*)\)\]\]'
            matches = re.findall(action_pattern, response_text)
            for action_type, params in matches:
                try:
                    param_dict = {}
                    if params:
                        for param in params.split(','):
                            if '=' in param:
                                key, value = param.strip().split('=', 1)
                                param_dict[key.strip()] = value.strip().strip(
                                    '"\'')
                    actions.append({'type': action_type, 'params': param_dict})
                except Exception:
                    pass
            clean_response = re.sub(action_pattern, '', response_text).strip()
        else:
            clean_response = response_text
        return clean_response, actions

    def execute_action(self, action, user):
        action_type = action.get('type')
        params = action.get('params', {})
        result = {'success': False, 'message': 'Unknown action'}

        if action_type == 'CREATE_NOTE':
            title = params.get('title', '')
            content = params.get('content', '')
            if content:
                note = Note.objects.create(user=user,
                                           title=title,
                                           content=content,
                                           content_type='markdown')
                result = {
                    'success': True,
                    'message': f'Created note: {note.title or "Untitled"}',
                    'note_id': note.id,
                    'action_type': 'note_created'
                }

        elif action_type == 'PIN_NOTE':
            note_id = params.get('note_id')
            if note_id:
                try:
                    note = Note.objects.get(id=int(note_id), user=user)
                    note.is_pinned = True
                    note.save()
                    result = {
                        'success': True,
                        'message': f'Pinned note: {note.title or "Untitled"}',
                        'note_id': note.id,
                        'action_type': 'note_pinned'
                    }
                except Note.DoesNotExist:
                    result = {'success': False, 'message': 'Note not found'}

        elif action_type == 'UNPIN_NOTE':
            note_id = params.get('note_id')
            if note_id:
                try:
                    note = Note.objects.get(id=int(note_id), user=user)
                    note.is_pinned = False
                    note.save()
                    result = {
                        'success': True,
                        'message':
                        f'Unpinned note: {note.title or "Untitled"}',
                        'note_id': note.id,
                        'action_type': 'note_unpinned'
                    }
                except Note.DoesNotExist:
                    result = {'success': False, 'message': 'Note not found'}

        return result

    def build_system_prompt(self, stats, notes_context):
        notes_info = json.dumps(notes_context, indent=2)
        return f"""You are an AI assistant for a note-taking application. You help users manage their notes, answer questions about their notes, and provide helpful information.

USER STATISTICS:
- Total Notes: {stats['total_notes']}
- Pinned Notes: {stats['pinned_notes']}
- Labels: {stats['label_count']}
- Storage Used: {stats['storage_used_mb']} MB

RECENT NOTES (up to 20):
{notes_info}

CAPABILITIES:
You can help users with:
1. Answering questions about their notes
2. Providing statistics and insights about their notes
3. Creating new notes from prompts
4. Pinning/unpinning notes
5. General questions and assistance

ACTION FORMAT:
When the user wants you to perform an action, include the action in your response using this format:
- Create note: [[ACTION:CREATE_NOTE(title="Note Title", content="Note content here")]]
- Pin note: [[ACTION:PIN_NOTE(note_id="123")]]
- Unpin note: [[ACTION:UNPIN_NOTE(note_id="123")]]

When creating notes, use markdown formatting. Always confirm actions with the user before executing operations.

Be helpful, concise, and friendly. If you don't know something or can't find relevant information in the user's notes, say so honestly."""

    def post(self, request):
        message = request.data.get('message')
        conversation_history = request.data.get('conversation_history', [])

        if not message:
            return Response({'error': 'Message is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        if len(message) > 5000:
            return Response(
                {'error': 'Message must be less than 5000 characters'},
                status=status.HTTP_400_BAD_REQUEST)

        if not has_credits(request.user, 'notes.ai_assistant'):
            return Response(
                {'error': 'No credits remaining. Please purchase more to use AI features.'},
                status=status.HTTP_402_PAYMENT_REQUIRED)

        try:
            stats = self.get_user_stats(request.user)
            notes_context = self.get_notes_context(request.user)
            system_prompt = self.build_system_prompt(stats, notes_context)

            conversation_text = ""
            for msg in conversation_history[-10:]:
                role = "User" if msg.get('role') == 'user' else "Assistant"
                conversation_text += f"{role}: {msg.get('content', '')}\n\n"

            full_prompt = f"{system_prompt}\n\nCONVERSATION HISTORY:\n{conversation_text}\n\nUser: {message}\n\nAssistant:"

            response = ai_service.model.generate_content(full_prompt)
            ai_response = response.text
            charge(request.user, 'notes.ai_assistant')

            clean_response, actions = self.parse_action_from_response(
                ai_response)

            action_results = []
            for action in actions:
                result = self.execute_action(action, request.user)
                action_results.append(result)

            return Response(
                {
                    'response': clean_response,
                    'actions': action_results,
                    'stats': stats
                },
                status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'AI assistant failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
