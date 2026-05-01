from rest_framework import serializers


class PreviewRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    use_print_css = serializers.BooleanField(required=False, default=False)


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    use_print_css = serializers.BooleanField(required=False, default=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )

    def validate(self, attrs):
        mode = attrs.get("mode", "exclude")
        selectors = attrs.get("selectors") or []
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")

        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )

        return attrs
