import { CustomField, NodeType } from '@/components/tree-editor/types';

/**
 * URLが有効かどうかをチェックする
 */
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * YouTubeのURLかどうかをチェックする
 */
export const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
};

/**
 * ノード名が有効かチェックする
 */
export const validateNodeName = (nodeName: string): boolean => {
    return nodeName.trim().length > 0;
};

/**
 * 必須フィールドのバリデーション
 */
export const validateRequiredFields = (
    nodeType: NodeType | null,
    customFields: CustomField[],
    t: (key: string, params?: any) => string,
): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    if (!nodeType) return errors;

    nodeType.fieldDefinitions.forEach((def) => {
        if (def.required) {
            const field = customFields.find((f) => f.definitionId === def.id || f.name === def.name);
            if (!field || !field.value.trim()) {
                errors[field?.id || def.id] = `${def.name}${t('dialogs.node.create.validation.fieldRequired')}`;
            }
        }
    });

    return errors;
};

/**
 * フィールドタイプに基づいたバリデーション（URL、YouTube等）
 */
export const validateFieldTypes = (
    customFields: CustomField[],
    t: (key: string, params?: any) => string,
): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    customFields.forEach((field) => {
        if (field.type === 'link' && field.value) {
            if (!isValidUrl(field.value)) {
                errors[field.id] = t('dialogs.node.create.validation.validUrl');
            }
        }

        if (field.type === 'youtube' && field.value) {
            if (!isValidYouTubeUrl(field.value)) {
                errors[field.id] = t('dialogs.node.create.validation.validYouTube');
            }
        }
    });

    return errors;
};

/**
 * ノードの完全なバリデーション
 */
export const validateNodeForm = (
    nodeName: string,
    nodeType: NodeType | null,
    customFields: CustomField[],
    t: (key: string, params?: any) => string,
): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    // 1. ノード名のバリデーション
    if (!validateNodeName(nodeName)) {
        errors['nodeName'] = t('dialogs.node.create.validation.nodeNameRequired');
    }

    // 2. 必須フィールドのバリデーション
    const requiredFieldErrors = validateRequiredFields(nodeType, customFields, t);
    Object.assign(errors, requiredFieldErrors);

    // 3. フィールドタイプのバリデーション
    const fieldTypeErrors = validateFieldTypes(customFields, t);
    Object.assign(errors, fieldTypeErrors);

    return errors;
};
