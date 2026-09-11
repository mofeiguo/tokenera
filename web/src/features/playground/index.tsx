/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundInput } from './components/input/playground-input'
import { PlaygroundToolbar } from './components/playground-toolbar'
import {
  useChatHandler,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundState,
} from './hooks'
import {
  PLAYGROUND_CHAT_BACKGROUND,
  PLAYGROUND_COLUMN,
  PLAYGROUND_INPUT_AREA,
  resolvePlaygroundEndpointType,
} from './lib'

export function Playground() {
  const {
    config,
    parameterEnabled,
    messages,
    isLoadingMessages,
    models,
    updateMessages,
    setModels,
    updateConfig,
    updateParameterEnabled,
    clearMessages,
  } = usePlaygroundState()

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    onMessageUpdate: updateMessages,
  })

  const {
    editingMessageKey,
    handleSendMessage,
    handleRegenerateMessage,
    handleEditMessage,
    handleEditOpenChange,
    applyEdit,
    handleDeleteMessage,
  } = usePlaygroundConversation({
    messages,
    updateMessages,
    sendChat,
  })

  const handleClearMessages = () => {
    handleEditOpenChange(false)
    clearMessages()
  }

  const { isLoadingModels } = usePlaygroundOptions({
    currentModel: config.model,
    currentEndpointType: config.endpointType,
    setModels,
    updateConfig,
  })

  return (
    <div
      className={`relative flex size-full min-h-0 flex-col overflow-hidden ${PLAYGROUND_CHAT_BACKGROUND}`}
    >
      <PlaygroundToolbar
        config={config}
        disabled={isGenerating}
        endpointValue={config.endpointType}
        hasMessages={messages.length > 0}
        isModelLoading={isLoadingModels}
        modelValue={config.model}
        models={models}
        onClearMessages={handleClearMessages}
        onConfigChange={updateConfig}
        onEndpointChange={(value) => updateConfig('endpointType', value)}
        onModelChange={(value) => {
          updateConfig('model', value)
          const selected = models.find((model) => model.value === value)
          updateConfig(
            'endpointType',
            resolvePlaygroundEndpointType(
              selected?.supportedEndpointTypes,
              ''
            )
          )
        }}
        onParameterEnabledChange={updateParameterEnabled}
        parameterEnabled={parameterEnabled}
      />

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${PLAYGROUND_CHAT_BACKGROUND}`}
      >
        <PlaygroundChat
          messages={messages}
          isLoadingMessages={isLoadingMessages}
          onRegenerateMessage={handleRegenerateMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          models={models}
          modelValue={config.model}
          isGenerating={isGenerating}
          editingKey={editingMessageKey}
          onCancelEdit={handleEditOpenChange}
          onSaveEdit={(newContent) => applyEdit(newContent, false)}
          onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
        />
      </div>

      <div className={PLAYGROUND_INPUT_AREA}>
        <div className={PLAYGROUND_COLUMN}>
          <PlaygroundInput
            disabled={isGenerating}
            isGenerating={isGenerating}
            isModelLoading={isLoadingModels}
            modelValue={config.model}
            models={models}
            onStop={stopGeneration}
            onSubmit={handleSendMessage}
          />
        </div>
      </div>
    </div>
  )
}
