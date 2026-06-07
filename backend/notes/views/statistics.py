from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..models import UserStorageStats


class UserStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get storage and usage statistics for the authenticated user
        """
        stats, created = UserStorageStats.objects.get_or_create(
            user=request.user)

        # If just created, recalculate to ensure accuracy
        if created:
            stats.recalculate_stats()

        return Response(
            {
                'storage_used_bytes': stats.storage_used_bytes,
                'storage_used_mb': stats.storage_used_mb,
                'note_count': stats.note_count,
                'label_count': stats.label_count,
                'updated_at': stats.updated_at
            },
            status=status.HTTP_200_OK)

    def post(self, request):
        """
        Force recalculation of statistics for the authenticated user
        """
        stats, _ = UserStorageStats.objects.get_or_create(user=request.user)
        result = stats.recalculate_stats()

        return Response(
            {
                'message': 'Statistics recalculated successfully',
                'storage_used_bytes': result['storage_used_bytes'],
                'storage_used_mb': result['storage_used_mb'],
                'note_count': result['note_count'],
                'label_count': result['label_count']
            },
            status=status.HTTP_200_OK)
