from rest_framework import serializers


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
