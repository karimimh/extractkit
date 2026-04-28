from rest_framework import serializers


class PreviewRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)


class ExportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(required=True)
    html_snapshot = serializers.CharField(required=False, allow_blank=True)
    base_url = serializers.URLField(required=False)
    selectors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        allow_empty=True,
    )
    mode = serializers.ChoiceField(
        choices=["include", "exclude"],
        required=False,
        default="exclude",
    )

    def validate(self, attrs):
        mode = attrs.get("mode", "exclude")
        selectors = attrs.get("selectors") or []
        html_snapshot = attrs.get("html_snapshot")
        base_url = attrs.get("base_url")

        if mode == "include" and not selectors:
            raise serializers.ValidationError(
                "At least one selector is required for include mode."
            )

        if html_snapshot and not base_url:
            raise serializers.ValidationError(
                "base_url is required when html_snapshot is provided."
            )

        return attrs
